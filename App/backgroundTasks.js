// App/backgroundTasks.js
// Background validation (PRO)
// - checks every ~15s (minimumInterval:15)
// - uses validateLicenseOnlineDetailed to respect pushInvalidate and device checks
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import { validateLicenseOnlineDetailed, clearLicense } from "./services/licenseService";

const TASK_NAME = "LICENSE_VALIDATION_TASK_PRO";

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const res = await validateLicenseOnlineDetailed();
    if (!res.valid) {
      await clearLicense();
      // Notify user
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Licencia inválida o desactivada",
          body: "Tu licencia fue desactivada o ya no es válida. Inicia sesión nuevamente.",
        },
        trigger: null,
      });
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (e) {
    console.error("Background task error", e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerLicenseValidationTask() {
  try {
    const already = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (already) return true;
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("Registered PRO background task");
    return true;
  } catch (e) {
    console.error("register task error", e);
    return false;
  }
}
