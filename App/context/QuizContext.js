import React, { createContext, useState, useEffect } from 'react';
import localQuestions from '../data/questions';

export const QuizContext = createContext();

function sampleUnique(arr = [], n = 1) {
  const copy = arr.slice();
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

export const QuizProvider = ({ children }) => {
  const [bank, setBank] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [currentQuizMode, setCurrentQuizMode] = useState(null);
  const [lastStartedSubject, setLastStartedSubject] = useState(null);

  useEffect(() => {
    setBank(localQuestions);
    const keys = Object.keys(localQuestions).map(k => ({
      key: k,
      title: k.charAt(0).toUpperCase() + k.slice(1)
    }));
    setSubjects(keys);
    setLoading(false);
  }, []);

  const buildFullQuiz = () => {
    const keys = Object.keys(bank);
    const assembled = [];
    keys.forEach(k => {
      const arr = bank[k] || [];
      const sampled = sampleUnique(arr, 5).map(q => ({ ...q, subject: k }));
      assembled.push(...sampled);
    });
    setQuizQuestions(assembled);
    setCurrentQuizMode('full');
    setLastStartedSubject(null);
  };

  const buildSubjectQuiz = (subjectKey) => {
    const arr = bank[subjectKey] || [];
    const sampled = sampleUnique(arr, 5).map(q => ({ ...q, subject: subjectKey }));
    setQuizQuestions(sampled);
    setCurrentQuizMode('subject');
    setLastStartedSubject(subjectKey);
  };

  const startQuiz = (mode = 'full', subjectKey = null) => {
    if (mode === 'full') buildFullQuiz();
    else if (mode === 'subject' && subjectKey) buildSubjectQuiz(subjectKey);
  };

  const getSubjectTitle = (subjectKey) => {
    const s = subjects.find(x => x.key === subjectKey);
    return s ? s.title : subjectKey;
  };

  return (
    <QuizContext.Provider
      value={{
        bank,
        subjects,
        quizQuestions,
        loading,
        startQuiz,
        getSubjectTitle,
        currentQuizMode,
        lastStartedSubject,
        setQuizQuestions,
      }}>
      {children}
    </QuizContext.Provider>
  );
};
