import React from 'react';
import { View } from 'react-native';
import { Modal, Portal, Button, Text } from 'react-native-paper';

export default function ResultModal({ visible, onDismiss, score, total, onRestart }) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ margin:20, padding:20, backgroundColor:'white', borderRadius:8 }}>
        <Text style={{ fontSize:20, marginBottom:12 }}>Resultado</Text>
        <Text>Obtuviste {score} de {total}</Text>
        <Button onPress={onRestart} style={{ marginTop:12 }}>Reiniciar</Button>
        <Button onPress={onDismiss} style={{ marginTop:6 }}>Cerrar</Button>
      </Modal>
    </Portal>
  );
}
