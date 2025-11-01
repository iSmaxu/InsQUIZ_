// App/components/LicenseGate.js
// Restaurado y mejorado: confía en token local, valida cada 30 s, offline 45 min

import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Alert, AppState } from "react-native";
import LicenseScreen from "../screens/LicenseScreen";
import {
  getLicenseToken,
  validateLicenseOnlineDetailed,
  clearLicense,
  attachPushInvalidateListener,
} from "../services/licenseService";

export default function LicenseGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [lastValidTime, setLastValidTime] = useState(null);
  const intervalRef = useRef(null);
  const listenerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const OFFLINE_TOLERANCE_MS = 45 * 60 * 1000;

  // --- Chequeo inicial ---
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const token = await getLicenseToken();
        if (token) {
          if (mounted) {
            setAuthorized(true);
            setLastValidTime(Date.now());
          }
          // validación silenciosa
          setTimeout(async () => {
            const res = await validateLicenseOnlineDetailed();
            if (!res.valid && res.reason !== "error") {
              await clearLicense();
              if (mounted) setAuthorized(false);
            }
          }, 2000);
        } else {
          if (mounted) setAuthorized(false);
        }
      } catch (e) {
        console.warn("init license error:", e);
        if (mounted) setAuthorized(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => (mounted = false);
  }, []);

  // --- Escucha pushInvalidate ---
  useEffect(() => {
    let active = true;
    const attach = async () => {
      const token = await getLicenseToken();
      if (!token) return;
      listenerRef.current = attachPushInvalidateListener(token, async () => {
        await clearLicense();
        if (active) {
          Alert.alert("Licencia desactivada", "Tu licencia fue desactivada por el administrador.");
          setAuthorized(false);
        }
      });
    };
    attach();
    return () => {
      active = false;
      if (listenerRef.current && typeof listenerRef.current === "function")
        listenerRef.current();
    };
  }, []);

  // --- Validación periódica ---
  useEffect(() => {
    if (authorized) {
      intervalRef.current = setInterval(async () => {
        try {
          const res = await validateLicenseOnlineDetailed();
          if (res.valid) {
            setLastValidTime(Date.now());
          } else {
            if (res.reason === "error") {
              const elapsed = lastValidTime ? Date.now() - lastValidTime : Infinity;
              if (elapsed <= OFFLINE_TOLERANCE_MS) return;
            }
            await clearLicense();
            Alert.alert("Licencia inválida", "Tu licencia ha sido revocada o ya no es válida.");
            setAuthorized(false);
          }
        } catch (e) {
          console.warn("periodic validation error", e);
        }
      }, 30 * 1000);
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [authorized, lastValidTime]);

  // --- Revalidar al volver a la app ---
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        try {
          const res = await validateLicenseOnlineDetailed();
          if (res.valid) {
            setAuthorized(true);
            setLastValidTime(Date.now());
          } else {
            await clearLicense();
            setAuthorized(false);
          }
        } catch (e) {
          console.warn("resume validation failed", e);
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#b91c1c" />
      </View>
    );

  if (!authorized)
    return <LicenseScreen onSuccess={() => { setAuthorized(true); setLastValidTime(Date.now()); }} />;

  return children;
}
