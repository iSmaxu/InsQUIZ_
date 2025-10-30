import React, { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QuizProvider } from "./App/context/QuizContext";
import HomeScreen from "./App/screens/HomeScreen";
import QuizScreen from "./App/screens/QuizScreen";
import ResultScreen from "./App/screens/ResultScreen";
import { StatusBar } from "expo-status-bar";
import LicenseGate from "./App/components/LicenseGate";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("📲 Notificación recibida:", notification);
    });
    return () => subscription.remove();
  }, []);

  return (
    <PaperProvider>
      <QuizProvider>
        <LicenseGate>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Quiz" component={QuizScreen} />
              <Stack.Screen name="Result" component={ResultScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </LicenseGate>
        <StatusBar style="light" />
      </QuizProvider>
    </PaperProvider>
  );
}
