// context/QuizContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import localQuestions from '../data/questions';
import { fetchRemoteQuestions } from '../services/api';

export const QuizContext = createContext();

const UPDATE_INTERVAL_HOURS = 6;
const HISTORY_KEY = 'quiz_history_per_subject';
const CACHE_KEY = 'quiz_bank';
const CACHE_UPDATE_KEY = 'quiz_bank_last_update';

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Selecciona n preguntas evitando las más recientes (historyIds: array de question ids/text)
function sampleUniqueFromPool(pool = [], n = 1, historySet = new Set()) {
  // Si pool vacío
  if (!pool || pool.length === 0) return [];

  // Filtrar por pregunta no vista recientemente (por texto de question)
  const available = pool.filter(q => !historySet.has(q.question));

  // Si hay suficientes en available, lo usamos; si no, usamos todo el pool (fallback)
  const effective = available.length >= n ? available : pool;

  // Shuffle y slice
  const shuffled = shuffleArray(effective);
  return shuffled.slice(0, n);
}

export const QuizProvider = ({ children }) => {
  const [bank, setBank] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [bankStatus, setBankStatus] = useState('loading'); // 'online'|'cached'|'local'
  const [history, setHistory] = useState({}); // { subjectKey: [questionText,...] }

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      console.warn('Error cargando history', e);
    }
  };

  const saveHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (e) {
      console.warn('Error guardando history', e);
    }
  };

  // Fuerza descarga desde remoto (si hay internet) y actualiza caché.
  const updateBank = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const netState = await NetInfo.fetch();
      let questionBank = null;

      // Leer caché
      const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
      const lastUpdate = await AsyncStorage.getItem(CACHE_UPDATE_KEY);
      const now = new Date();
      const shouldUpdate =
        force ||
        !lastUpdate ||
        (now - new Date(lastUpdate)) / (1000 * 60 * 60) > UPDATE_INTERVAL_HOURS;

      if (cachedRaw && !force) {
        // precarga caché para rapidez; si hay internet y shouldUpdate true lo sobreescribimos abajo
        questionBank = JSON.parse(cachedRaw);
        console.log('📦 Banco cargado desde caché');
      }

      if (netState.isConnected && shouldUpdate) {
        console.log('🌐 Intentando descargar banco remoto...');
        const remote = await fetchRemoteQuestions();
        if (remote && Object.keys(remote).length > 0) {
          questionBank = remote;
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote));
          await AsyncStorage.setItem(CACHE_UPDATE_KEY, now.toISOString());
          console.log('✅ Banco remoto guardado en caché');
        } else {
          console.warn('⚠️ No se obtuvo contenido remoto válido');
        }
      } else if (!netState.isConnected) {
        console.log('📴 Sin conexión: usando caché/local');
      } else {
        console.log('⏱ Caché reciente: no se descargó remoto');
      }

      if (!questionBank) {
        questionBank = localQuestions;
        console.log('💾 Usando banco local por defecto');
      }

      setBank(questionBank);

      const keys = Object.keys(questionBank).map(k => ({
        key: k,
        title: k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' '),
      }));
      setSubjects(keys);

      // status
      if (netState.isConnected && questionBank !== localQuestions) setBankStatus('online');
      else if (cachedRaw) setBankStatus('cached');
      else setBankStatus('local');
    } catch (err) {
      console.error('❌ Error updateBank:', err);
      setBank(localQuestions);
      setBankStatus('local');
    } finally {
      setLoading(false);
    }
  }, []);

  // init
  useEffect(() => {
    loadHistory();
    updateBank(false);
  }, [updateBank]);

  // Construcción del quiz: usa history para evitar repeticiones, y actualiza history con preguntas seleccionadas.
  const buildQuiz = useCallback(async (mode = 'full', subjectKey = null) => {
    const assembled = [];
    const newHistory = { ...(history || {}) };

    if (mode === 'full') {
      const keys = Object.keys(bank);
      for (const k of keys) {
        const arr = bank[k] || [];
        // number per subject: 5 (si hay menos, toma lo que haya)
        const want = Math.min(5, arr.length);
        const histSet = new Set(newHistory[k] || []);
        const sampled = sampleUniqueFromPool(arr, want, histSet);
        sampled.forEach(q => {
          assembled.push({ ...q, subject: k });
          // push to newHistory
          newHistory[k] = (newHistory[k] || []).concat(q.question).slice(-300); // mantenemos hasta 300 por materia
        });
      }
    } else if (mode === 'subject' && subjectKey) {
      const arr = bank[subjectKey] || [];
      const want = Math.min(5, arr.length);
      const histSet = new Set(newHistory[subjectKey] || []);
      const sampled = sampleUniqueFromPool(arr, want, histSet);
      sampled.forEach(q => {
        assembled.push({ ...q, subject: subjectKey });
        newHistory[subjectKey] = (newHistory[subjectKey] || []).concat(q.question).slice(-300);
      });
    }

    // barajar todo el ensamblado final
    const final = shuffleArray(assembled);
    setQuizQuestions(final);

    // guardar history (persistente)
    await saveHistory(newHistory);
  }, [bank, history]);

  // API expuesto
  const startQuiz = async (mode = 'full', subjectKey = null) => {
    await buildQuiz(mode, subjectKey);
  };

  const finishQuiz = async () => {
    // Al finalizar un quiz, intentamos actualizar banco remoto (si hay internet)
    console.log('🔁 finishQuiz -> intentando actualizar banco remoto');
    await updateBank(true);
    // También podríamos resetear history si quieres (no lo hacemos para evitar repeticiones)
  };

  const forceUpdateBank = async () => {
    await updateBank(true);
  };

  return (
    <QuizContext.Provider
      value={{
        bank,
        subjects,
        quizQuestions,
        loading,
        startQuiz,
        finishQuiz,
        forceUpdateBank,
        bankStatus,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
