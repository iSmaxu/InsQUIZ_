import React from 'react';
import { StyleSheet } from 'react-native';
import { Modal, Portal, Button, Text } from 'react-native-paper';

export default function ResultModal({ visible, onDismiss, score, total, onRestart }) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Text style={styles.title}>Resultado</Text>
        <Text style={styles.text}>
          Obtuviste {score} de {total}
        </Text>
        <Button mode="contained" onPress={onRestart} style={styles.button}>
          Reiniciar
        </Button>
        <Button mode="outlined" onPress={onDismiss} style={styles.button}>
          Cerrar
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    width: '80%',
    marginTop: 10,
    borderRadius: 8,
  },
});
