// app/quiz/[quizId]/results/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchQuizResults, fetchQuizAttempt } from '@/actions/QuizResults';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import { useSession } from 'next-auth/react';
import { fetchQuestionsByQuiz } from '@/actions/QuestionsAPI';
import { Question } from '@/types/Question';


interface QuizResult {
    quiz_id: number;
    attempt_id: number;
    start_time: string;
    end_time: string;
    time_spent: number;
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    questions: Array<{
        question_id: number;
        statement: string;
        options: string[];
        correct_option: number;
        selected_option: number;
        is_correct: boolean;
    }>;
}

export default function QuizResults() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const numericUserId: number = Number(userId);
    const [results, setResults] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const quizId = parseInt(params.quizId as string);
    const router = useRouter();

    // Update the useEffect in your existing results page
useEffect(() => {
  async function fetchResults() {
    try {
      if (!numericUserId) return;

      const attemptData = await fetchQuizAttempt(quizId, numericUserId);

      if (attemptData.error || !attemptData.attempt_id) {
        throw new Error(attemptData.error || 'No attempt found for this quiz');
      }

      const data = await fetchQuizResults(attemptData.attempt_id, numericUserId);

      if (!data) {
        throw new Error('Failed to fetch results');
      }

      // Ensure all questions are displayed, even unanswered ones
      const allQuestions = await fetchQuestionsByQuiz(quizId);
      if (allQuestions) {
        // Merge results with all questions to ensure none are missing
        data.questions = allQuestions.map((q: Question) => {
          const answeredQuestion = data.questions.find((aq: any) => aq.question_id === q.id);
          return answeredQuestion || {
            question_id: q.id,
            statement: q.question_statement,
            options: [q.option1, q.option2, q.option3, q.option4],
            correct_option: q.correct_option,
            selected_option: null,
            is_correct: false
          };
        });
      }

      setResults(data);
    } catch (err) {
      console.error('Error fetching quiz results:', err);
      setError('Failed to load quiz results. You may not have completed this quiz yet.');
    } finally {
      setLoading(false);
    }
  }

  if (quizId && numericUserId) {
    fetchResults();
  }
}, [quizId, numericUserId]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const optionIndexToLetter = (index: number) => {
        return String.fromCharCode(65 + index - 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !results) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="alert alert-danger max-w-md mx-auto">
                    <h4 className="alert-heading">Error</h4>
                    <p>{error || 'Failed to load results'}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn btn-outline-primary mt-2"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <UserProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-primary mb-2">Quiz Results</h1>
                        <p className="text-lg text-gray-600">Review your performance for Quiz #{quizId}</p>
                    </div>

                    {/* Summary */}
                    <div className="bg-white shadow-lg rounded-lg mb-8 overflow-hidden">
                        <div className="bg-primary text-white p-4">
                            <h2 className="text-2xl font-bold mb-0">Summary</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-3xl font-bold">{results.score_percentage}%</div>
                                    <div className="text-gray-600">Score</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{results.correct_answers}/{results.total_questions}</div>
                                    <div className="text-gray-600">Correct Answers</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{formatTime(results.time_spent)}</div>
                                    <div className="text-gray-600">Time Spent</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{formatDate(results.end_time)}</div>
                                    <div className="text-gray-600">Completed</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Questions Review */}
                    {results.questions.map((question, index) => (
                        <div key={question.question_id} className="bg-white shadow-sm rounded-lg mb-6 overflow-hidden">
                            <div className={`p-4 ${question.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold mb-0">Question #{index + 1}</h3>
                                    <span className={`badge ${question.is_correct ? 'bg-green-500' : 'bg-red-500'} text-white px-2 py-1 rounded`}>
                                        {question.is_correct ? 'Correct' : 'Incorrect'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-lg font-semibold mb-4">{question.statement}</p>

                                <div className="space-y-3 mb-4">
                                    {question.options.map((option, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded ${idx === question.correct_option - 1
                                                ? 'bg-green-100 border border-green-500'
                                                : idx === question.selected_option - 1
                                                    ? 'bg-red-100 border border-red-500'
                                                    : 'bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                                                <span>{option}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gray-100 p-3 rounded">
                                    <span className="font-bold">Your answer: </span>
                                    <span className={question.is_correct ? 'text-green-600' : 'text-red-600'}>
                                        {question.selected_option ? optionIndexToLetter(question.selected_option) : 'Not answered'}
                                    </span>
                                    {!question.is_correct && (
                                        <>
                                            <span className="mx-3">•</span>
                                            <span className="font-bold">Correct answer: </span>
                                            <span className="text-green-600">{optionIndexToLetter(question.correct_option)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Actions */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
                        >
                            ← Back to Dashboard
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Print Results
                        </button>
                    </div>
                </div>
            </div>
        </UserProtectedRoute>
    );
}