import React, { useContext, useState, useEffect } from 'react';
import { View } from 'react-native';
import { QuizContext } from '../context/QuizContext';
import QuestionCard from '../components/QuestionCard';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import ResultModal from '../components/ResultModal';

export default function QuizScreen({ navigation }) {
  const { quizQuestions, loading } = useContext(QuizContext);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (quizQuestions && quizQuestions.length > 0) {
      setCurrent(quizQuestions[index]);
    }
  }, [quizQuestions, index]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No hay preguntas disponibles.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Volver
        </Button>
      </View>
    );
  }

  const handleAnswer = (selectedOption) => {
    const isCorrect = selectedOption === current.answer;
    if (isCorrect) setScore((prev) => prev + 1);

    const nextIndex = index + 1;

    if (nextIndex < quizQuestions.length) {
      setTimeout(() => setIndex(nextIndex), 200);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setIndex(0);
    setScore(0);
    setShowResult(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <QuestionCard item={current} onSelect={handleAnswer} />
      <View
        style={{
          padding: 12,
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>
          Pregunta {index + 1} / {quizQuestions.length}
        </Text>
      </View>

      <ResultModal
        visible={showResult}
        onDismiss={() => navigation.goBack()}
        score={score}
        total={quizQuestions.length}
        onRestart={handleRestart}
      />
    </View>
  );
}
