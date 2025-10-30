// screens/QuizScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { View } from 'react-native';
import { QuizContext } from '../context/QuizContext';
import QuestionCard from '../components/QuestionCard';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import ResultModal from '../components/ResultModal';

export default function QuizScreen({ navigation }) {
  const { quizQuestions, loading, finishQuiz } = useContext(QuizContext);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    setIndex(0);
    setScore(0);
    setShowResult(false);
  }, [quizQuestions]);

  useEffect(() => {
    if (quizQuestions && quizQuestions.length > 0) {
      setCurrent(quizQuestions[index]);
    } else {
      setCurrent(null);
    }
  }, [quizQuestions, index]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9ff' }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9ff' }}>
        <Text>No hay preguntas disponibles.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>Volver</Button>
      </View>
    );
  }

  const handleAnswer = (selectedOption) => {
    // This is called once per question by QuestionCard
    const correct = selectedOption === current.answer;
    if (correct) setScore(prev => prev + 1);

    const next = index + 1;
    if (next < quizQuestions.length) {
      setIndex(next);
    } else {
      // end quiz
      setShowResult(true);
      // cuando se cierra el modal (volver al home) puede llamarse finishQuiz; o lo llamamos aquí ahora:
      // preferimos llamar finishQuiz cuando usuario vuelve al home (en ResultScreen) para no bloquear modal
    }
  };

  const handleModalDismiss = async () => {
    setShowResult(false);
    // llamar finishQuiz para actualizar banco remoto automáticamente
    try { await finishQuiz(); } catch (e) { console.warn(e); }
    navigation.navigate('Home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9ff' }}>
      <QuestionCard item={current} onAnswer={handleAnswer} />
      <View style={{ padding: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }}>
        <Text style={{ fontWeight: 'bold', color: '#333' }}>
          Pregunta {index + 1} / {quizQuestions.length}
        </Text>
      </View>

      <ResultModal
        visible={showResult}
        onDismiss={handleModalDismiss}
        score={score}
        total={quizQuestions.length}
        onRestart={() => {
          setIndex(0);
          setScore(0);
          setShowResult(false);
        }}
      />
    </View>
  );
}
// End of App/screens/QuizScreen.js