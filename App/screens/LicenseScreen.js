// App/screens/LicenseScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { activateLicense } from "../services/licenseService";

export default function LicenseScreen({ onSuccess }) {
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleActivate = async () => {
    if (!license.trim()) {
      setError("Por favor, ingresa tu código de licencia.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await activateLicense(license.trim());
      if (result.ok) {
        Alert.alert("Activación exitosa", "Licencia activada correctamente.");
        onSuccess && onSuccess();
      } else {
        Alert.alert("Error", result.error || "No se pudo activar la licencia.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un error durante la activación.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#000", "#300"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#ff4444" />
        <Text style={{ marginTop: 10, color: "#fff" }}>Validando licencia...</Text>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient
          colors={["#000", "#600"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(25,25,25,0.85)",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              shadowColor: "#ff0000",
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 12,
                color: "#fff",
              }}
            >
              Activar licencia
            </Text>
            <TextInput
              placeholder="Código de licencia"
              placeholderTextColor="#aaa"
              value={license}
              onChangeText={setLicense}
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#ff4444",
                backgroundColor: "#111",
                color: "#fff",
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            />
            <Button title="Activar" color="#b40000" onPress={handleActivate} />
            {error ? (
              <Text style={{ color: "#ff6666", marginTop: 10, textAlign: "center" }}>
                {error}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
