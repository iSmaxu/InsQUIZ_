// hooks/useCheckUpdate.js
import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

export default function useCheckUpdate() {
  useEffect(() => {
    async function checkForUpdate() {
      try {
        // Revisar si hay update OTA disponible
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          // Descargar update
          await Updates.fetchUpdateAsync();

          // Obtener información del update
          // releaseChannelMessage = mensaje que pusiste en eas update --message
          const updateMessage =
            Updates.manifest?.releaseChannelMessage ||
            "Nueva versión disponible";

          const currentVersion = Constants.manifest.version || "desconocida";

          // Alert al usuario
          Alert.alert(
            "Actualización disponible",
            `Versión actual: ${currentVersion}\n${updateMessage}\nLa app se reiniciará para aplicar la nueva versión.`,
            [
              {
                text: "Actualizar ahora",
                onPress: async () => {
                  await Updates.reloadAsync();
                },
              },
              { text: "Después", style: "cancel" },
            ],
            { cancelable: true }
          );
        }
      } catch (err) {
        console.log("⚠️ Error buscando actualizaciones:", err);
      }
    }

    checkForUpdate();
  }, []);
}
