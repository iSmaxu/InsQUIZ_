// LicenseService.js — versión estable con notificaciones push y compatibilidad Android/iOS

import { db } from "../firebase/firebaseConfig";
import { ref, get, update, set, child } from "firebase/database";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { registerPushToken } from "./notificationService"; // ✅ integración push

const APP_ID = Constants.expoConfig?.extra?.appId || "insquiz-app";

// ✅ Identificador único de dispositivo, compatible Android e iOS
async function getDeviceId() {
  try {
    if (Platform.OS === "android") {
      return Application.androidId || Device.deviceName || "android_device";
    } else if (Platform.OS === "ios") {
      const iosId = await Application.getIosIdForVendorAsync();
      return iosId || Device.deviceName || "ios_device";
    } else {
      return "unknown_device";
    }
  } catch (e) {
    console.warn("Error obteniendo ID de dispositivo:", e.message);
    return "unknown_device";
  }
}

// 🔐 Guardar licencia localmente
export async function saveLicenseToken(licenseKey) {
  try {
    await SecureStore.setItemAsync(`${APP_ID}_license`, licenseKey);
  } catch (e) {
    console.warn("Error guardando licencia:", e);
  }
}

// 📦 Obtener licencia guardada
export async function getSavedLicense() {
  try {
    return await SecureStore.getItemAsync(`${APP_ID}_license`);
  } catch (e) {
    console.warn("Error leyendo licencia local:", e);
    return null;
  }
}

// 🧹 Borrar licencia guardada
export async function clearSavedLicense() {
  try {
    await SecureStore.deleteItemAsync(`${APP_ID}_license`);
  } catch (e) {
    console.warn("Error limpiando licencia local:", e);
  }
}

// 🔍 Validar licencia en Firebase
export async function validateLicenseOnline(licenseKey) {
  try {
    const snap = await get(child(ref(db), `licenses/${licenseKey}`));
    if (!snap.exists()) return { ok: false, error: "Licencia no encontrada" };

    const data = snap.val();
    if (!data.active) return { ok: false, error: "Licencia inactiva" };

    if (data.expiresAt && data.expiresAt !== "indefinida") {
      const exp = new Date(data.expiresAt);
      if (exp <= new Date()) {
        return { ok: false, error: "Licencia expirada" };
      }
    }

    return { ok: true, data };
  } catch (e) {
    console.error("Error validando licencia:", e);
    return { ok: false, error: "Error de conexión" };
  }
}

// ⚙️ Activar licencia + registrar dispositivo + notificaciones push
export async function activateLicense(licenseKey) {
  const deviceId = await getDeviceId();

  try {
    const licenseRef = ref(db, `licenses/${licenseKey}`);
    const snap = await get(licenseRef);
    if (!snap.exists()) return { ok: false, error: "Licencia no encontrada" };

    const data = snap.val();

    if (!data.active) return { ok: false, error: "Licencia inactiva" };

    const devices = data.devices || {};
    const deviceCount = Object.keys(devices).length;
    const maxDevices = data.maxDevices || 1;

    // Ya registrado
    if (devices[deviceId]) {
      await saveLicenseToken(licenseKey);
      return { ok: true, data };
    }

    if (deviceCount >= maxDevices)
      return { ok: false, error: "Máximo de dispositivos alcanzado" };

    // Registrar nuevo dispositivo
    const now = new Date().toISOString();
    await update(licenseRef, {
      [`devices/${deviceId}`]: {
        registeredAt: now,
        signature: Device.deviceName || "unknown",
      },
    });

    await saveLicenseToken(licenseKey);

    // ✅ Registrar token de notificación push
    try {
      await registerPushToken(licenseKey);
      console.log("📲 Token push registrado correctamente.");
    } catch (e) {
      console.warn("⚠️ No se pudo registrar token push:", e.message);
    }

    console.log(`✅ Dispositivo ${deviceId} registrado en licencia ${licenseKey}`);
    return { ok: true, data };
  } catch (e) {
    console.error("Error activando licencia:", e);
    return { ok: false, error: "Error de conexión" };
  }
}

// ❌ Desactivar dispositivo
export async function deactivateDevice(licenseKey) {
  try {
    const deviceId = await getDeviceId();
    const deviceRef = ref(db, `licenses/${licenseKey}/devices/${deviceId}`);
    await set(deviceRef, null);
    await clearSavedLicense();
    return { ok: true };
  } catch (e) {
    console.error("Error al desactivar dispositivo:", e);
    return { ok: false };
  }
}
