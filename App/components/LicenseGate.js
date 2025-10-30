// App/components/LicenseGate.js
// LicenseGate (PRO)
// - revalidación cada 15s
// - modo offline: tolerancia 45 minutos
// - escucha pushInvalidate para invalidación instantánea
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

  const OFFLINE_TOLERANCE_MS = 45 * 60 * 1000; // 45 minutes

  // initial check
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const saved = await getLicenseToken();
        if (!saved) {
          if (mounted) setAuthorized(false);
          return;
        }

        const res = await validateLicenseOnlineDetailed();
        if (res.valid) {
          if (mounted) {
            setAuthorized(true);
            setLastValidTime(Date.now());
          }
        } else {
          // if offline or network error allow grace period
          if (res.reason === "error") {
            const prev = Date.now();
            if (mounted) {
              setAuthorized(true);
              setLastValidTime(prev);
            }
          } else {
            // invalid for other reasons
            if (mounted) setAuthorized(false);
          }
        }
      } catch (e) {
        console.log("init license check error", e);
        if (mounted) setAuthorized(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => (mounted = false);
  }, []);

  // attach pushInvalidate listener for local token
  useEffect(() => {
    let mounted = true;
    const attach = async () => {
      const token = await getLicenseToken();
      if (!token) return;
      listenerRef.current = attachPushInvalidateListener(token, async () => {
        await clearLicense();
        Alert.alert("Licencia desactivada", "Tu licencia fue desactivada por el administrador.");
        setAuthorized(false);
      });
    };
    attach();
    return () => {
      if (listenerRef.current && typeof listenerRef.current === "function") listenerRef.current();
      mounted = false;
    };
  }, []);

  // periodic 15s validation
  useEffect(() => {
    if (authorized) {
      intervalRef.current = setInterval(async () => {
        try {
          const res = await validateLicenseOnlineDetailed();
          if (res.valid) {
            setLastValidTime(Date.now());
            // stay authorized
          } else {
            // if reason is network error, check offline tolerance
            if (res.reason === "error") {
              const elapsed = lastValidTime ? Date.now() - lastValidTime : Infinity;
              if (elapsed <= OFFLINE_TOLERANCE_MS) {
                // still allow in offline grace
                return;
              }
            }
            // otherwise invalidate
            await clearLicense();
            Alert.alert("Licencia inválida", "Tu licencia ha sido revocada o ya no es válida.");
            setAuthorized(false);
          }
        } catch (e) {
          console.warn("periodic validation error", e);
        }
      }, 15 * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authorized, lastValidTime]);

  // app state listener to trigger immediate re-check on resume
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        // app resumed, force a validation
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#b91c1c" />
      </View>
    );
  }

  if (!authorized) {
    return <LicenseScreen onSuccess={() => { setAuthorized(true); setLastValidTime(Date.now()); }} />;
  }

  return children;
}
