// components/QuestionCard.js
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Vibration } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function QuestionCard({ item, onAnswer, delay = 900 }) {
  // item: { question, options:[], answer }
  const [disabled, setDisabled] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const animsRef = useRef([]); // Animated.Value for each option

  // recreate animated values when item changes
  useEffect(() => {
    animsRef.current = (item?.options || []).map(() => new Animated.Value(0));
    setDisabled(false);
    setSelectedIdx(null);
  }, [item]);

  const animateTo = (idx, toValue) => {
    const anim = animsRef.current[idx];
    if (!anim) return;
    Animated.timing(anim, {
      toValue,
      duration: 260,
      useNativeDriver: false,
    }).start();
  };

  const resetAnims = () => {
    animsRef.current.forEach(a => a && a.setValue(0));
  };

  const handlePress = (option, idx) => {
    if (disabled) return;
    setDisabled(true);
    setSelectedIdx(idx);

    const isCorrect = option === item.answer;

    // vibración simple
    if (isCorrect) Vibration.vibrate(40);
    else Vibration.vibrate([0, 60, 30, 60]);

    // animar seleccionado: si correcto -> 1 (verde), si incorrecto -> 2 (rojo)
    animateTo(idx, isCorrect ? 1 : 2);

    // si incorrecto, marcar la correcta también (verde)
    if (!isCorrect) {
      const correctIdx = item.options.findIndex(o => o === item.answer);
      if (correctIdx !== -1 && correctIdx !== idx) {
        setTimeout(() => animateTo(correctIdx, 1), 200);
      }
    }

    // esperar delay ms, informar al padre y resetear
    setTimeout(() => {
      // enviar respuesta al padre (solo una vez)
      try { onAnswer(option); } catch (e) { /* guard */ }

      // resetear anims y estado para siguiente pregunta
      resetAnims();
      setDisabled(false);
      setSelectedIdx(null);
    }, delay);
  };

  const getInterpolatedStyle = (animatedValue) => {
    // inputRange: 0 neutral, 1 correct (green), 2 incorrect (red)
    if (!animatedValue) return {};
    const bg = animatedValue.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['#f0f0f0', '#dcedc8', '#ffdada'],
    });
    const border = animatedValue.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['#e0e0e0', '#8bc34a', '#e53935'],
    });
    return { backgroundColor: bg, borderColor: border };
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.question}>{item?.question || 'Pregunta'}</Text>

          {item?.options?.map((opt, idx) => {
            const anim = animsRef.current[idx];
            const animStyle = anim ? getInterpolatedStyle(anim) : { backgroundColor: '#f0f0f0', borderColor: '#e0e0e0' };

            return (
              <Animated.View key={idx} style={[styles.optionWrap, animStyle]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePress(opt, idx)}
                  disabled={disabled}
                  style={styles.optionBtn}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  card: { borderRadius: 12, elevation: 3, backgroundColor: '#fff' },
  question: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 18, color: '#222' },
  optionWrap: { borderRadius: 10, marginBottom: 10, borderWidth: 1.4, overflow: 'hidden' },
  optionBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  optionText: { fontSize: 16, color: '#222', textAlign: 'center' },
});
