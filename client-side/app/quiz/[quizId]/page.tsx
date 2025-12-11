'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
  const [isMockTest, setIsMockTest] = useState(false);
  const [mockTestContext, setMockTestContext] = useState<any>(null);

  const params = useParams();
  const quizId = parseInt(params.quizId as string);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const numericUserId = Number(userId);

  const LS_ANSWERS_KEY = `quiz_${quizId}_answers`;
  const LS_INDEX_KEY = `quiz_${quizId}_index`;
  const LS_ENDTIME_KEY = `quiz_${quizId}_endtime`;

  // Check if this is a mock test quiz
  useEffect(() => {
    const mockTestParam = searchParams.get('mockTest');
    const attemptId = searchParams.get('attempt');
    const mockTestId = searchParams.get('mockTestId');

    if (mockTestParam === 'true' && attemptId && mockTestId) {
      setIsMockTest(true);
      setMockTestContext({
        mockTestId: parseInt(mockTestId),
        attemptId: parseInt(attemptId)
      });

      // Store context in localStorage for after submission
      localStorage.setItem('mockTestContext', JSON.stringify({
        mockTestId: parseInt(mockTestId),
        attemptId: parseInt(attemptId),
        quizId
      }));
    }
  }, [searchParams, quizId]);

  // ✅ Check if user has already attempted the quiz
  useEffect(() => {
    async function checkAttempt() {
      if (!quizId || !numericUserId) return;

      try {
        const attemptData = await fetchQuizAttempt(quizId, numericUserId);
        if (attemptData?.has_attempt && !isMockTest) {
          setHasAttempted(true);
          router.push(`/quiz/${quizId}/results`);
        }
      } catch (err) {
        console.error('Error checking quiz attempt:', err);
      }
    }

    checkAttempt();
  }, [quizId, numericUserId, router, isMockTest]);

  // ✅ Fetch questions and initialize quiz
  useEffect(() => {
    async function loadQuestions() {
      if (!quizId || (hasAttempted && !isMockTest)) return;

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

    if (!hasAttempted || isMockTest) {
      loadQuestions();
    }
  }, [quizId, hasAttempted, numericUserId, isMockTest]);

  // ✅ Initialize quiz state with server action for duration
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

    // ✅ Use server action instead of client-side fetch
    let duration = 60; // fallback duration in minutes
    try {
      console.log("Fetching quiz duration for quiz ID:", quizId);
      duration = await fetchQuizDuration(quizId);
      setQuizDuration(duration);
    } catch (err) {
      console.error('Error fetching quiz duration:', err);
      // Continue with fallback duration
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

  // In QuizPage.tsx, update the handleSubmit function:
  const handleSubmit = useCallback(async () => {
    if (submitting || !quizState) return;
    setSubmitting(true);

    try {
      const result = await submitQuiz(quizId, quizState.answers, quizState.timeRemaining, numericUserId);
      if (result) {
        localStorage.removeItem(LS_ANSWERS_KEY);
        localStorage.removeItem(LS_INDEX_KEY);
        localStorage.removeItem(LS_ENDTIME_KEY);

        // Check if this is a mock test quiz
        const mockTestContext = localStorage.getItem('mockTestContext');

        if (mockTestContext && isMockTest) {
          const context = JSON.parse(mockTestContext);
          const { mockTestId, attemptId } = context;

          // Clear the context
          localStorage.removeItem('mockTestContext');

          // Redirect back to mock test with quiz score
          router.push(`/mock-tests/${mockTestId}/attempt/${attemptId}?quizScore=${result.score_percentage}`);
        } else {
          // Regular quiz flow
          router.push(`/quiz/${quizId}/results`);
        }
      } else {
        setError('Failed to submit quiz. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('An error occurred while submitting the quiz.');
    } finally {
      setSubmitting(false);
    }
  }, [quizId, quizState, numericUserId, submitting, isMockTest, router]);

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
  if (hasAttempted && !isMockTest) {
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
        isMockTest={isMockTest}
      />
    </UserProtectedRoute>
  );
}