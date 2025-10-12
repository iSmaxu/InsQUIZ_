import React, { useContext } from 'react';
import { View, ScrollView } from 'react-native';
import { Button, Title, ActivityIndicator, Text, Card } from 'react-native-paper';
import { QuizContext } from '../context/QuizContext';

export default function HomeScreen({ navigation }) {
  const { loading, bank, subjects, startQuiz } = useContext(QuizContext);

  if (loading) return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator animating={true} /></View>;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems:'center', justifyContent:'center', padding:20 }}>
      <Title>Simulacro ICFES</Title>
      <Text style={{ marginTop: 8 }}>Selecciona una opción:</Text>

      <Button mode="contained" onPress={() => { startQuiz('full'); navigation.navigate('Quiz'); }} style={{ marginTop:16 }}>
        Iniciar simulacro completo (25 preguntas)
      </Button>

      <Card style={{ width: '100%', marginTop: 16, padding: 8 }}>
        <Text style={{ marginBottom: 8, fontWeight: '600' }}>O elegir por materia (5 preguntas)</Text>
        {subjects.map((s) => (
          <Button
            key={s.key}
            mode="outlined"
            onPress={() => { startQuiz('subject', s.key); navigation.navigate('Quiz'); }}
            style={{ marginVertical: 6 }}
          >
            {s.title}
          </Button>
        ))}
      </Card>

      <Text style={{ marginTop:12, fontSize:12, color:'#666' }}>Las preguntas se seleccionan aleatoriamente desde la base local (offline).</Text>
    </ScrollView>
  );
}
