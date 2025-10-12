import React from 'react';
import { View } from 'react-native';
import { Text, Button, Title } from 'react-native-paper';

export default function ResultScreen({ route, navigation }) {
  const { score = 0, total = 0 } = route.params || {};
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:20 }}>
      <Title>Resultado</Title>
      <Text style={{ marginVertical:10 }}>Obtuviste {score} de {total}</Text>
      <Button mode="contained" onPress={() => navigation.navigate('Home')}>Volver al inicio</Button>
    </View>
  );
}
