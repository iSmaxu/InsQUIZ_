// /app/services/notificationService.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { db } from "../firebase/firebaseConfig";
import { ref, update } from "firebase/database";


export async function registerPushToken(licenseKey) {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Permiso de notificaciones no concedido.");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  })).data;

  const deviceId = Application.androidId || Constants.installationId;
  const deviceRef = ref(db, `licenses/${licenseKey}/devices/${deviceId}`);
  await update(deviceRef, { expoToken: token });

  console.log("✅ Token push registrado:", token);
}
