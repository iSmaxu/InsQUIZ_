import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function QuestionCard({ item, onSelect }) {
  return (

        <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Card style={{ borderRadius: 16, elevation: 4 }}>
        <Card.Content>
          {/* Pregunta */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {item?.question || 'Pregunta aquí'}
          </Text>

          {/* Opciones */}
          {item?.options?.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={{
                backgroundColor: '#f5f5f5',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 10,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#ddd',
              }}
              onPress={() => onSelect(option)}
            >
              <Text style={{ fontSize: 16 }}>{option}</Text>
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>
    </View>
  );
}
