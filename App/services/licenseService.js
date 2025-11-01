// App/services/licenseService.js
// InsQuiz - License Service (versión actualizada)
// Maneja almacenamiento local, logs, validación periódica y pushInvalidate

import * as SecureStore from "expo-secure-store";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  get,
  child,
  update,
  push,
  set,
  onValue,
} from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// ---------- FIREBASE CONFIG ----------
const firebaseConfig = {
  apiKey: "AIzaSyCGFQPk4idrDgFpl1f0ixKF7D63vLYjZGA",
  authDomain: "insquiz-admin.firebaseapp.com",
  databaseURL: "https://insquiz-admin-default-rtdb.firebaseio.com",
  projectId: "insquiz-admin",
  storageBucket: "insquiz-admin.firebasestorage.app",
  messagingSenderId: "236979447253",
  appId: "1:236979447253:web:08c9075dbfa1183fa9095c",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ---------- CREDENCIALES DE SERVICIO ----------
const SERVICE_EMAIL = "system-reader@insquiz.app";
const SERVICE_PASS = "123456insquiz";

async function ensureAuth() {
  if (!auth.currentUser) {
    try {
      await signInWithEmailAndPassword(auth, SERVICE_EMAIL, SERVICE_PASS);
      console.log("✅ Autenticado como lector del sistema");
    } catch (err) {
      console.error("❌ Error de autenticación:", err.message);
    }
  }
}

// ---------- ALMACENAMIENTO LOCAL ----------
export async function saveLicenseToken(token) {
  await SecureStore.setItemAsync("licenseToken", token);
}

export async function getLicenseToken() {
  return await SecureStore.getItemAsync("licenseToken");
}

export async function clearLicense() {
  await SecureStore.deleteItemAsync("licenseToken");
}

// ---------- FIRMA DEL DISPOSITIVO ----------
function getDeviceSignature() {
  const id = Application.androidId || Constants.installationId || "unknown-id";
  const name =
    (Constants.expoConfig && Constants.expoConfig.name) ||
    Constants.deviceName ||
    "unknown-device";
  return `${id}::${name}`;
}

// ---------- REGISTRO DE LOGS ----------
async function pushLog(licenseKey, action, extra = {}) {
  try {
    await ensureAuth();
    const logRef = ref(db, `licenses/${licenseKey}/logs`);
    const entry = {
      action,
      device: getDeviceSignature(),
      date: new Date().toISOString(),
      ...extra,
    };
    await push(logRef, entry);
  } catch (e) {
    console.warn("[pushLog]", e.message || e);
  }
}

// ---------- ACTIVAR LICENCIA ----------
export async function activateLicense(licenseKey) {
  try {
    await ensureAuth();

    const snap = await get(child(ref(db), `licenses/${licenseKey}`));
    if (!snap.exists()) return { ok: false, error: "Licencia no encontrada." };
    const data = snap.val();

    // --- Validación de estado ---
    if (!data.active) {
      await pushLog(licenseKey, "activate_attempt_inactive");
      return { ok: false, error: "Licencia inactiva o suspendida." };
    }

    // --- Dispositivo actual ---
    const deviceSignature = getDeviceSignature();
    const deviceId = Application.androidId || Constants.installationId || "unknown-device";

    // --- Garantizar arrays válidos ---
    const devices = Array.isArray(data.devices) ? data.devices : [];
    const deviceSignatures = Array.isArray(data.deviceSignatures)
      ? data.deviceSignatures
      : [];

    // --- ¿Ya está registrado este dispositivo? ---
    const isRegistered =
      devices.includes(deviceId) || deviceSignatures.includes(deviceSignature);

    if (isRegistered) {
      await saveLicenseToken(licenseKey);
      await pushLog(licenseKey, "activate_success_existing");
      return { ok: true, data };
    }

    // --- Verificar límite de dispositivos ---
    const total = devices.length + deviceSignatures.length;
    const max = data.maxDevices || 1;
    if (total >= max) {
      await pushLog(licenseKey, "activate_fail_max_devices", { count: total });
      return {
        ok: false,
        error: `Esta licencia alcanzó el número máximo (${max}) de dispositivos permitidos.`,
      };
    }

    // --- Registrar nuevo dispositivo ---
    const newDevices = [...devices, deviceId];
    const newSignatures = [...deviceSignatures, deviceSignature];

    await update(ref(db, `licenses/${licenseKey}`), {
      devices: newDevices,
      deviceSignatures: newSignatures,
    });

    await saveLicenseToken(licenseKey);
    await pushLog(licenseKey, "activate_success_new");

    return { ok: true, data };
  } catch (error) {
    console.error("Error activating license:", error);
    return { ok: false, error: error.message || "Error desconocido al activar licencia." };
  }
}


// ---------- VALIDAR LICENCIA ----------
export async function validateLicenseOnlineDetailed() {
  try {
    await ensureAuth();
    const licenseKey = await getLicenseToken();
    if (!licenseKey) return { valid: false, reason: "no_local_token" };

    const snap = await get(child(ref(db), `licenses/${licenseKey}`));
    if (!snap.exists()) return { valid: false, reason: "not_found" };

    const data = snap.val();

    if (data.pushInvalidate) {
      await update(ref(db, `licenses/${licenseKey}`), { pushInvalidate: false });
      await pushLog(licenseKey, "invalidate_pushed");
      return { valid: false, reason: "invalidated_by_admin" };
    }

    if (!data.active) return { valid: false, reason: "inactive" };

    const deviceSignature = getDeviceSignature();
    const deviceId = Application.androidId || Constants.installationId || "unknown-device";
    const authorized =
      (data.deviceSignatures || []).includes(deviceSignature) ||
      (data.devices || []).includes(deviceId);

    if (!authorized) return { valid: false, reason: "device_not_authorized" };

    await pushLog(licenseKey, "validate_ok");
    return { valid: true };
  } catch (error) {
    console.error("validateLicenseOnlineDetailed error:", error);
    return { valid: false, reason: "error", error: error.message };
  }
}

export async function validateLicenseOnline() {
  const res = await validateLicenseOnlineDetailed();
  return res.valid === true;
}

// ---------- ESCUCHA PUSH INVALIDATE ----------
export function attachPushInvalidateListener(licenseKey, onInvalidate) {
  try {
    ensureAuth();
    const node = ref(db, `licenses/${licenseKey}/pushInvalidate`);
    return onValue(node, (snap) => {
      const val = snap.val();
      if (val) {
        update(ref(db, `licenses/${licenseKey}`), { pushInvalidate: false }).catch(() => {});
        onInvalidate && onInvalidate();
      }
    });
  } catch (e) {
    console.warn("attachPushInvalidateListener:", e.message || e);
    return null;
  }
}
