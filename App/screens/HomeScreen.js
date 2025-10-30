// screens/HomeScreen.js
import React, { useContext, useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Button, Title, ActivityIndicator, Text, Card, Chip } from "react-native-paper";
import * as Updates from "expo-updates";
import { QuizContext } from "../context/QuizContext";
import { clearLicense } from "../services/licenseService"; // 🔹 Importar función para cerrar sesión

export default function HomeScreen({ navigation }) {
  const { loading, subjects, startQuiz, bankStatus } = useContext(QuizContext);
  const [updating, setUpdating] = useState(false);

  const getChipStyle = () => {
    switch (bankStatus) {
      case "online":
        return { color: "#2e7d32", background: "#d0f0c0", text: "🌐 Banco online actualizado" };
      case "cached":
        return { color: "#b26a00", background: "#fff3b0", text: "🗄 Usando banco desde caché local" };
      case "local":
        return { color: "#9e0000", background: "#f8d7da", text: "💾 Banco local sin conexión" };
      default:
        return { color: "#6a0dad", background: "#e0d7f8", text: "Cargando banco..." };
    }
  };

  const chipStyle = getChipStyle();

  // 🔄 Buscar actualizaciones OTA
  const handleOTAUpdate = async () => {
    try {
      setUpdating(true);
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert("Actualización encontrada", "Descargando actualización...");
        await Updates.fetchUpdateAsync();
        Alert.alert("Actualización lista", "Se aplicará ahora.", [
          { text: "OK", onPress: () => Updates.reloadAsync() },
        ]);
      } else {
        Alert.alert("Sin actualizaciones", "Ya tienes la última versión instalada ✅");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo buscar actualizaciones. Verifica tu conexión.");
    } finally {
      setUpdating(false);
    }
  };

  // 🚪 Cerrar sesión (borrar licencia)
  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Deseas cerrar sesión y borrar tu licencia del dispositivo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: async () => {
            try {
              await clearLicense();

              const navigateToLicense = () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "License" }],
                });
              };

              // ALERTA FINAL QUE NAVEGA INMEDIATAMENTE
              Alert.alert(
                "Sesión cerrada",
                "Tu licencia ha sido borrada correctamente.",
                [{ text: "OK", onPress: navigateToLicense }],
                { cancelable: true, onDismiss: navigateToLicense }
              );
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "No se pudo cerrar sesión correctamente.");
            }
          },
        },
      ]
    );
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator animating={true} size="large" color="#6a0dad" />
      </View>
    );

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#f9f9ff",
      }}
    >
      <Title style={{ fontSize: 28, fontWeight: "bold", color: "#6a0dad" }}>
        Simulacro ICFES
      </Title>

      <Chip
        style={{
          marginTop: 10,
          backgroundColor: chipStyle.background,
        }}
        textStyle={{ color: chipStyle.color, fontWeight: "600" }}
      >
        {chipStyle.text}
      </Chip>

      {/* 🛰 Buscar actualizaciones OTA */}
      <Button
        mode="outlined"
        onPress={handleOTAUpdate}
        loading={updating}
        disabled={updating}
        style={{
          marginTop: 12,
          borderColor: "#6a0dad",
          borderWidth: 1.5,
        }}
        textColor="#6a0dad"
      >
        🚀 Buscar actualizaciones
      </Button>

      <Text style={{ marginTop: 18, fontSize: 16, color: "#444" }}>
        Selecciona una opción:
      </Text>

      {/* 🟣 Simulacro completo */}
      <Button
        mode="contained"
        onPress={() => {
          startQuiz("full");
          navigation.navigate("Quiz");
        }}
        style={{
          marginTop: 20,
          backgroundColor: "#6a0dad",
          width: "90%",
          paddingVertical: 8,
          borderRadius: 12,
        }}
        labelStyle={{ fontSize: 16 }}
      >
        Iniciar simulacro completo (25 preguntas)
      </Button>

      {/* 📘 Selección por materia */}
      <Card
        style={{
          width: "100%",
          marginTop: 20,
          padding: 10,
          borderRadius: 16,
          backgroundColor: "#ffffff",
          elevation: 3,
        }}
      >
        <Text
          style={{
            marginBottom: 8,
            fontWeight: "600",
            textAlign: "center",
            color: "#333",
          }}
        >
          O elegir por materia (5 preguntas)
        </Text>

        {subjects.map((s) => {
          let color = "#6a0dad";
          if (s.key.includes("mate")) color = "#e53935";
          else if (s.key.includes("lectura")) color = "#1565c0";
          else if (s.key.includes("ingles")) color = "#009688";
          else if (s.key.includes("ciencias_naturales")) color = "#43a047";
          else if (s.key.includes("ciencias_sociales")) color = "#fbc02d";

          return (
            <Button
              key={s.key}
              mode="contained"
              onPress={() => {
                startQuiz("subject", s.key);
                navigation.navigate("Quiz");
              }}
              style={{
                marginVertical: 6,
                backgroundColor: color,
                width: "100%",
                borderRadius: 10,
              }}
              labelStyle={{ fontSize: 15 }}
            >
              {s.title}
            </Button>
          );
        })}
      </Card>

      <Text
        style={{
          marginTop: 14,
          fontSize: 12,
          color: "#666",
          textAlign: "center",
          width: "90%",
        }}
      >
        Las preguntas se actualizan automáticamente al finalizar un quiz o al presionar el botón de
        actualización OTA.
      </Text>

      {/* 🚪 BOTÓN DE CIERRE DE SESIÓN */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          marginTop: 35,
          marginBottom: 40,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.8,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: "#b40000",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          ➜ Cerrar sesión
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
// End of screens/HomeScreen.js
