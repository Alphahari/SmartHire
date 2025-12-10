'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';

import { 
  fetchMockTestDetails, 
  submitMockTestAttempt 
} from '@/actions/MockTestAPI';

import { MockTestDetails } from '@/types/MockTest';

export default function MockTestAttemptPage() {
  const [currentStep, setCurrentStep] = useState<'quiz' | 'coding' | 'completed'>('quiz');
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [codingScore, setCodingScore] = useState<number | null>(null);
  const [mockTestDetails, setMockTestDetails] = useState<MockTestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);

  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const mockTestId = parseInt(params.mockTestId as string);
  const attemptId = parseInt(params.attemptId as string);

  /** Load mock test details */
  useEffect(() => {
    if (mockTestId) {
      loadMockTestDetails();
    }
  }, [mockTestId]);

  const loadMockTestDetails = async () => {
    try {
      const details = await fetchMockTestDetails(mockTestId);
      setMockTestDetails(details);
    } catch (err) {
      console.error('Failed to fetch mock test details:', err);
    } finally {
      setLoading(false);
    }
  };

  /** Timer */
  useEffect(() => {
    const timer = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  /** Quiz complete handler */
  const handleQuizComplete = (score: number) => {
    setQuizScore(score);
    setCurrentStep('coding');
  };

  /** Coding complete handler */
  const handleCodingComplete = async (score: number) => {
    setCodingScore(score);
    setCurrentStep('completed');

    try {
      await submitMockTestAttempt(attemptId, {
        quiz_score: quizScore || 0,
        coding_score: score,
        time_spent: timeSpent
      });
    } catch (err) {
      console.error('Failed to submit mock test results:', err);
    }
  };

  const calculateTotalScore = () => {
    if (quizScore === null || codingScore === null) return 0;
    return ((quizScore + codingScore) / 2).toFixed(1);
  };

  /* ------------------------------------------------------
     LOADING SCREEN
  ------------------------------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3">Loading mock test...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------
     QUIZ SECTION
  ------------------------------------------------------ */
  if (currentStep === 'quiz' && mockTestDetails) {
    return (
      <UserProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8">

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {mockTestDetails.name} - Quiz Section
              </h1>

              <div className="flex items-center justify-between mt-2">
                <p className="text-gray-600">Complete the quiz to proceed</p>
                <div className="flex items-center text-gray-500">
                  <span className="mr-2">⏱️</span>
                  <span>
                    {Math.floor(timeSpent / 60)}:
                    {(timeSpent % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quiz Instructions</h2>

              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-6">
                <li>Subject: {mockTestDetails?.quiz?.subject_name}</li>
                <li>Duration: {mockTestDetails?.quiz?.duration} minutes</li>
                <li>You cannot return after finishing</li>
              </ul>

              <div className="flex justify-between">
                <button
                  onClick={() => router.push('/mock-tests')}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel Test
                </button>

                <button
                  onClick={() => router.push(`/quiz/${mockTestDetails.quiz.id}?attempt=${attemptId}`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Quiz
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-2">Tips for Success</h3>
              <ul className="text-blue-700 space-y-2">
                <li>• Read carefully</li>
                <li>• Manage time</li>
                <li>• Review answers</li>
              </ul>
            </div>

          </div>
        </div>
      </UserProtectedRoute>
    );
  }

  /* ------------------------------------------------------
     CODING SECTION
  ------------------------------------------------------ */
  if (currentStep === 'coding' && mockTestDetails) {
    return (
      <UserProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {mockTestDetails.name} - Coding Challenge
            </h1>

            <div className="flex items-center justify-between mb-8">
              <p className="text-gray-600">
                Quiz Score: <strong>{quizScore?.toFixed(1)}%</strong>
              </p>
              <div className="text-gray-500">
                ⏱️ {Math.floor(timeSpent / 60)}:
                {(timeSpent % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Coding Problem */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow-md rounded-lg p-6">

                  <h2 className="text-xl font-semibold mb-3">
                    {mockTestDetails.coding_question?.title}
                  </h2>

                  {/* Difficulty */}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                      mockTestDetails.coding_question?.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800'
                        : mockTestDetails.coding_question?.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {mockTestDetails.coding_question?.difficulty}
                  </span>

                  <p className="text-gray-700 whitespace-pre-line">
                    {mockTestDetails.coding_question?.description}
                  </p>

                  <button
                    onClick={() =>
                      router.push(`/coding/practice?question=${mockTestDetails.coding_question.id}&attempt=${attemptId}`)
                    }
                    className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
                  >
                    Start Coding Challenge
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">

                {/* Progress */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="font-semibold text-gray-800 mb-4">Progress</h3>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Quiz</span>
                      <span className="text-green-600">Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Coding</span>
                      <span className="text-yellow-600">In Progress</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="font-semibold text-yellow-800 mb-2">Coding Tips</h3>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Check edge cases</li>
                    <li>• Write clean & readable code</li>
                    <li>• Test with samples first</li>
                  </ul>
                </div>

              </div>

            </div>
          </div>
        </div>
      </UserProtectedRoute>
    );
  }

  /* ------------------------------------------------------
     COMPLETED PAGE
  ------------------------------------------------------ */
  if (currentStep === 'completed') {
    return (
      <UserProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">

          <div className="max-w-2xl bg-white rounded-xl shadow-xl p-8 w-full">

            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                🎉
              </div>
              <h1 className="text-3xl font-bold">Mock Test Completed!</h1>
              <p className="text-gray-600">Great work</p>
            </div>

            {/* Score Boxes */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <p className="text-2xl font-bold text-blue-700">{quizScore?.toFixed(1)}%</p>
                <p className="text-sm text-blue-600">Quiz Score</p>
              </div>

              <div className="bg-green-50 rounded-lg p-6 text-center">
                <p className="text-2xl font-bold text-green-700">{codingScore?.toFixed(1)}%</p>
                <p className="text-sm text-green-600">Coding Score</p>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-6 text-center mb-8">
              <p className="text-4xl font-bold text-purple-700">{calculateTotalScore()}%</p>
              <p className="text-lg font-semibold">Overall Score</p>

              <p className="mt-3 text-gray-600">
                ⏱ {Math.floor(timeSpent / 60)}:
                {(timeSpent % 60).toString().padStart(2, '0')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/mock-tests')}
                className="flex-1 border border-gray-300 rounded-lg py-3 hover:bg-gray-100"
              >
                Back to Mock Tests
              </button>
              <button
                onClick={() => router.push('/interview/ai/upload')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-3 hover:opacity-90"
              >
                Continue to AI Interview
              </button>
              <button
                onClick={() => router.push('/dashboard?tab=past-quizzes')}
                className="flex-1 bg-green-600 text-white rounded-lg py-3 hover:bg-green-700"
              >
                View Results
              </button>
            </div>

          </div>

        </div>
      </UserProtectedRoute>
    );
  }

  return null;
}
