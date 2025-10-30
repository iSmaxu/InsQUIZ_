import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

export default function ResultScreen({ route, navigation }) {
  const { score, total } = route.params || { score: 0, total: 0 };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text style={styles.title}>Resultado Final</Text>
          <Text style={styles.score}>
            {score} / {total}
          </Text>
          <Text style={styles.subtitle}>¡Buen trabajo!</Text>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.navigate('Home')}
          >
            Volver al inicio
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    elevation: 3,
    backgroundColor: '#fff',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  score: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 30,
  },
  button: {
    borderRadius: 8,
  },
});
