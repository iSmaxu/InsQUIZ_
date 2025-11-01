// App/screens/LicenseScreen.js
// Pantalla de activación limpia y reactiva

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
import { activateLicense } from "../services/licenseService";

export default function LicenseScreen({ onSuccess }) {
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleActivate = async () => {
    if (!license.trim()) {
      setError("Por favor ingresa tu código de licencia.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await activateLicense(license.trim());
      if (result.ok) {
        Alert.alert("Activación exitosa", "Tu licencia fue activada correctamente.");
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

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Validando licencia...</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ padding: 24, justifyContent: "center", flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", textAlign: "center", color: "#fff", marginBottom: 12 }}>
            Activar licencia
          </Text>
          <TextInput
            placeholder="Código de licencia"
            placeholderTextColor="#777"
            value={license}
            onChangeText={setLicense}
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: "#444",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              color: "#fff",
            }}
          />
          <Button title="Activar" color="#b91c1c" onPress={handleActivate} />
          {error ? <Text style={{ color: "#f33", marginTop: 10 }}>{error}</Text> : null}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
