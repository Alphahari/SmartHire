'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Question } from '@/types/Question';
import { fetchQuestionsByQuiz } from '@/actions/QuestionsAPI';
import { startQuiz } from '@/actions/QuizStart';
import { submitQuiz } from '@/actions/QuizSubmit';
import { fetchQuizAttempt } from '@/actions/QuizResults';

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
  const [quizDuration, setQuizDuration] = useState<number>(0); // ✅ Store duration from backend

  const params = useParams();
  const quizId = parseInt(params.quizId as string);
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const numericUserId = Number(userId);

  const LS_ANSWERS_KEY = `quiz_${quizId}_answers`;
  const LS_INDEX_KEY = `quiz_${quizId}_index`;
  const LS_ENDTIME_KEY = `quiz_${quizId}_endtime`;

  // ✅ Check if user has already attempted the quiz
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

  // ✅ Fetch questions and initialize quiz
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

    if (!hasAttempted) {
      loadQuestions();
    }
  }, [quizId, hasAttempted, numericUserId]);

  // ✅ Initialize quiz state with duration fetch
  const initializeQuizState = async (questions: Question[]) => {
    if (questions.length === 0) {
      setError('No questions found for this quiz.');
      return;
    }

    const savedAnswers = localStorage.getItem(LS_ANSWERS_KEY);
    const savedIndex = localStorage.getItem(LS_INDEX_KEY);
    const savedEndTime = localStorage.getItem(LS_ENDTIME_KEY);

    const initialAnswers: Record<number, number | null> = {};
    questions.forEach(q => {
      initialAnswers[q.id] = null;
    });

    let endTime: Date | null = null;
    let timeRemaining = 0;

    // ✅ Try to fetch quiz duration
    let duration = 60; // fallback duration in minutes
    try {
      const response = await fetch(`http://localhost:5000/api/quiz/${quizId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const quizData = await response.json();
        if (quizData.duration) {
          duration = quizData.duration;
          setQuizDuration(duration);
        }
      } else {
        console.warn('Failed to fetch quiz duration. Using fallback.');
      }
    } catch (err) {
      console.error('Error fetching quiz duration:', err);
    }

    if (savedEndTime) {
      endTime = new Date(savedEndTime);
      timeRemaining = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
    } else {
      endTime = new Date(Date.now() + duration * 60 * 1000);
      timeRemaining = duration * 60;
      localStorage.setItem(LS_ENDTIME_KEY, endTime.toISOString());

      const startData = await startQuiz(quizId, numericUserId);
      if (!startData) {
        setError('Failed to start quiz. You may have already attempted it.');
        return;
      }
    }

    const initialState: QuizState = {
      currentQuestionIndex: savedIndex ? parseInt(savedIndex) : 0,
      answers: savedAnswers ? { ...initialAnswers, ...JSON.parse(savedAnswers) } : initialAnswers,
      timeRemaining,
      endTime,
    };

    setQuizState(initialState);
  };

  // ✅ Answer selection
  const handleAnswerSelect = (questionId: number, option: number) => {
    if (!quizState) return;

    const updatedAnswers = {
      ...quizState.answers,
      [questionId]: option
    };

    const newState = {
      ...quizState,
      answers: updatedAnswers
    };

    setQuizState(newState);
    localStorage.setItem(LS_ANSWERS_KEY, JSON.stringify(updatedAnswers));
  };

  // ✅ Navigation
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

  // ✅ Time update
  const handleTimeUpdate = useCallback((newTime: number) => {
    setQuizState(prev => prev ? { ...prev, timeRemaining: newTime } : null);
  }, []);

  // ✅ Submit
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
      } else {
        setError('Failed to submit quiz. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('An error occurred while submitting the quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Loading UI
  if (loading || !quizState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  // ✅ Error UI
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="alert alert-danger max-w-md mx-auto p-4 rounded shadow">
          <h4 className="font-bold text-lg mb-2">Quiz Error</h4>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-sm btn-outline-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ Redundant hasAttempted screen (safety net)
  if (hasAttempted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Quiz Already Attempted
          </h2>
          <p className="text-gray-600 mb-4">
            You have already attempted this quiz. View your results instead.
          </p>
          <button
            onClick={() => router.push(`/quiz/${quizId}/results`)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  // ✅ Main quiz interface
  return (
    <UserProtectedRoute>
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
    </UserProtectedRoute>
  );
}
