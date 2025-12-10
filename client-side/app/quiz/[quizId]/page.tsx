'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle } from 'lucide-react'; // Added icons

import { Question } from '@/types/Question';
import { fetchQuestionsByQuiz } from '@/actions/QuestionsAPI';
import { startQuiz } from '@/actions/QuizStart';
import { submitQuiz } from '@/actions/QuizSubmit';
import { fetchQuizAttempt } from '@/actions/QuizResults';
import { fetchQuizDuration } from '@/actions/QuizzesAPI';

import QuizInterface from '@/components/Quiz/QuizInterface';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, number | null>;
  timeRemaining: number;
  endTime: Date | null;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [quizDuration, setQuizDuration] = useState<number>(0);

  const params = useParams();
  const quizId = parseInt(params.quizId as string);
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const numericUserId = Number(userId);

  const LS_ANSWERS_KEY = `quiz_${quizId}_answers`;
  const LS_INDEX_KEY = `quiz_${quizId}_index`;
  const LS_ENDTIME_KEY = `quiz_${quizId}_endtime`;

  // ... (Keep all existing useEffects and logic unchanged) ...
  // Re-pasting logic for completeness not required, but assuming logic block is here
  // [LOGIC SECTION - SAME AS BEFORE] 
  
  // -- FOR BRIEFNESS, ASSUME LOGIC IS IDENTICAL TO YOUR ORIGINAL FILE HERE --
  // (I am only modifying the Render/Return statements below)

  // ... logic code ... 
  
  // Note: Ensure you keep the logic from your original file. 
  // I will just paste the Render section fixes below.

  useEffect(() => {
    async function checkAttempt() {
      if (!quizId || !numericUserId) return;
      try {
        const attemptData = await fetchQuizAttempt(quizId, numericUserId);
        if (attemptData?.has_attempt) {
          setHasAttempted(true);
          router.push(`/quiz/${quizId}/results`);
        }
      } catch (err) {
        console.error('Error checking quiz attempt:', err);
      }
    }
    checkAttempt();
  }, [quizId, numericUserId, router]);

  useEffect(() => {
    async function loadQuestions() {
      if (!quizId || hasAttempted) return;
      try {
        const questionsData = await fetchQuestionsByQuiz(quizId);
        if (!questionsData || questionsData.length === 0) {
          setError('No questions found for this quiz.');
          return;
        }
        setQuestions(questionsData);
        await initializeQuizState(questionsData);
      } catch (err) {
        console.error('Error loading quiz questions:', err);
        setError('Failed to load quiz questions.');
      } finally {
        setLoading(false);
      }
    }
    if (!hasAttempted) loadQuestions();
  }, [quizId, hasAttempted, numericUserId]);

  const initializeQuizState = async (questions: Question[]) => {
    if (questions.length === 0) {
      setError('No questions found for this quiz.');
      return;
    }
    const savedAnswers = localStorage.getItem(LS_ANSWERS_KEY);
    const savedIndex = localStorage.getItem(LS_INDEX_KEY);
    const savedEndTime = localStorage.getItem(LS_ENDTIME_KEY);
    const initialAnswers: Record<number, number | null> = {};
    questions.forEach(q => { initialAnswers[q.id] = null; });
    let endTime: Date | null = null;
    let timeRemaining = 0;
    let duration = 60; 
    try {
      duration = await fetchQuizDuration(quizId);
      setQuizDuration(duration);
    } catch (err) { console.error(err); }

    if (savedEndTime) {
      endTime = new Date(savedEndTime);
      timeRemaining = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
    } else {
      endTime = new Date(Date.now() + duration * 60 * 1000);
      timeRemaining = duration * 60;
      localStorage.setItem(LS_ENDTIME_KEY, endTime.toISOString());
      const startData = await startQuiz(quizId, numericUserId);
      if (!startData) { setError('Failed to start quiz. You may have already attempted it.'); return; }
    }
    const initialState: QuizState = {
      currentQuestionIndex: savedIndex ? parseInt(savedIndex) : 0,
      answers: savedAnswers ? { ...initialAnswers, ...JSON.parse(savedAnswers) } : initialAnswers,
      timeRemaining,
      endTime,
    };
    setQuizState(initialState);
  };

  const handleAnswerSelect = (questionId: number, option: number) => {
    if (!quizState) return;
    const updatedAnswers = { ...quizState.answers, [questionId]: option };
    const newState = { ...quizState, answers: updatedAnswers };
    setQuizState(newState);
    localStorage.setItem(LS_ANSWERS_KEY, JSON.stringify(updatedAnswers));
  };

  const handleNextQuestion = () => {
    if (!quizState || quizState.currentQuestionIndex >= questions.length - 1) return;
    const newIndex = quizState.currentQuestionIndex + 1;
    setQuizState({ ...quizState, currentQuestionIndex: newIndex });
    localStorage.setItem(LS_INDEX_KEY, newIndex.toString());
  };

  const handlePrevQuestion = () => {
    if (!quizState || quizState.currentQuestionIndex <= 0) return;
    const newIndex = quizState.currentQuestionIndex - 1;
    setQuizState({ ...quizState, currentQuestionIndex: newIndex });
    localStorage.setItem(LS_INDEX_KEY, newIndex.toString());
  };

  const handleTimeUpdate = useCallback((newTime: number) => {
    setQuizState(prev => prev ? { ...prev, timeRemaining: newTime } : null);
  }, []);

  const handleSubmit = async () => {
    if (submitting || !quizState) return;
    setSubmitting(true);
    try {
      const result = await submitQuiz(quizId, quizState.answers, quizState.timeRemaining, numericUserId);
      if (result) {
        localStorage.removeItem(LS_ANSWERS_KEY);
        localStorage.removeItem(LS_INDEX_KEY);
        localStorage.removeItem(LS_ENDTIME_KEY);
        router.push(`/quiz/${quizId}/results`);
      } else { setError('Failed to submit quiz. Please try again.'); }
    } catch (err) {
      console.error(err);
      setError('An error occurred while submitting the quiz.');
    } finally { setSubmitting(false); }
  };

  // --- RENDER UPDATES START HERE ---

  // FIX: Wrapped Loading UI in standard layout
  if (loading || !quizState) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-500 font-medium">Preparing your assessment...</p>
        </div>
      </div>
    );
  }

  // FIX: Wrapped Error UI in standard layout
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertCircle className="text-red-500 w-8 h-8" />
          </div>
          <h4 className="font-bold text-xl text-gray-900 mb-2">Quiz Error</h4>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // FIX: Wrapped Attempted Screen in standard layout
  if (hasAttempted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Quiz Already Attempted</h2>
          <p className="text-gray-500 mb-8">
            You have already recorded a score for this assessment.
          </p>
          <button
            onClick={() => router.push(`/quiz/${quizId}/results`)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition shadow-md"
          >
            View Your Results
          </button>
        </div>
      </div>
    );
  }

  // FIX: Wrapped Main Interface in max-w-7xl to prevent full-width stretch
  return (
    <UserProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <QuizInterface
            questions={questions}
            quizState={quizState}
            onAnswerSelect={handleAnswerSelect}
            onNextQuestion={handleNextQuestion}
            onPrevQuestion={handlePrevQuestion}
            onSubmit={handleSubmit}
            onTimeUpdate={handleTimeUpdate}
            submitting={submitting}
          />
        </div>
      </div>
    </UserProtectedRoute>
  );
}