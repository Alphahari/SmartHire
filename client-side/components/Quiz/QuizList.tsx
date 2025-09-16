// components/Quiz/QuizList.tsx
import { Quiz } from '@/types/Quiz';
import { useRouter } from 'next/navigation';

interface QuizListProps {
  quizzes: Quiz[];
  loading: boolean;
  error: string | null;
  chapterId: number;
}

const QuizList = ({ quizzes, loading, error, chapterId }: QuizListProps) => {
  const router = useRouter();

  const handleQuizClick = (quizId: number) => {
    router.push(`/quiz/${quizId}`);
  };

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

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  if (quizzes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-600">No quizzes available for this chapter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="bg-white shadow-md hover:shadow-xl border border-gray-200 rounded-xl p-6 transition duration-300 ease-in-out cursor-pointer"
          onClick={() => handleQuizClick(quiz.id)}
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
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
              Start Quiz
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuizList;