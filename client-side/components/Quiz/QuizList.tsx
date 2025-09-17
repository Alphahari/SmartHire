// components/Quiz/QuizList.tsx

import { Quiz } from '@/types/Quiz';
import { useRouter } from 'next/navigation';
import { fetchQuizAttemptStatus } from '@/actions/QuizResults';
import { useEffect, useState } from 'react';

interface QuizListProps {
  quizzes: Quiz[];
  loading: boolean;
  error: string | null;
  chapterId: number;
  userId: number;
}

const QuizList = ({ quizzes, loading, error, chapterId, userId }: QuizListProps) => {
  const router = useRouter();
  const [attemptedQuizzes, setAttemptedQuizzes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch attempted quizzes
  useEffect(() => {
    async function checkAttempts() {
      if (userId && chapterId) {
        const status = await fetchQuizAttemptStatus(chapterId, userId);
        if (status) {
          setAttemptedQuizzes(status.map((a: any) => a.quiz_id));
        }
      }
    }

    checkAttempts();
  }, [userId, chapterId]);

  // Determine quiz status
  const getQuizStatus = (quiz: Quiz) => {
    const now = currentTime;
    const startTime = new Date(quiz.start_time);
    const endTime = new Date(quiz.end_time);

    if (now < startTime) return 'not_started';
    if (now > endTime) return 'expired';
    return 'active';
  };

  // Handle quiz click
  const handleQuizClick = (quizId: number, status: string) => {
    if (status !== 'active') return;

    if (attemptedQuizzes.includes(quizId)) {
      router.push(`/quiz/${quizId}/results`);
    } else {
      router.push(`/quiz/${quizId}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded mb-4 w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  // Empty state
  if (quizzes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-600">No quizzes available for this chapter.</p>
      </div>
    );
  }

  // Render quiz list
  return (
    <div className="grid grid-cols-1 gap-4">
      {quizzes.map((quiz) => {
        const status = getQuizStatus(quiz);
        const isAttempted = attemptedQuizzes.includes(quiz.id);

        return (
          <div
            key={quiz.id}
            className={`bg-white shadow-md border border-gray-200 rounded-xl p-6 transition duration-300 ease-in-out ${
              status === 'active' ? 'hover:shadow-xl cursor-pointer' : 'cursor-not-allowed opacity-70'
            }`}
            onClick={() => handleQuizClick(quiz.id, status)}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {quiz.remarks || `Quiz ${quiz.id}`}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Duration:</strong> {quiz.duration} minutes
              </div>
              <div>
                <strong>Available until:</strong> {new Date(quiz.end_time).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-4">
              {status === 'not_started' ? (
                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                  Starts {new Date(quiz.start_time).toLocaleDateString()}
                </span>
              ) : status === 'expired' ? (
                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                  Expired
                </span>
              ) : isAttempted ? (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  View Results
                </span>
              ) : (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Start Quiz
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuizList;