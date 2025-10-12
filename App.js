import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QuizProvider } from './App/context/QuizContext';
import HomeScreen from './App/screens/HomeScreen';
import QuizScreen from './App/screens/QuizScreen';
import ResultScreen from './App/screens/ResultScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <QuizProvider>
        <NavigationContainer>
          <Stack.Navigator
           initialRouteName="Home" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </QuizProvider>
    </PaperProvider>
  );
}
