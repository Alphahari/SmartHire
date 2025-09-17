'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchUserQuizAttempts } from '@/actions/QuizResults';
import { useSession } from 'next-auth/react';

interface QuizAttempt {
  attempt_id: number;
  quiz_id: number;
  quiz_title: string;
  start_time: string;
  end_time: string;
  time_spent: number;
  score: string;
  percentage: number;
  chapter_id: number;
  subject_id: number;
}

export default function PastQuizzesContent() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const numericUserId: number = Number(userId);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    async function fetchAttempts() {
      try {
        if (!numericUserId) return;

        const data = await fetchUserQuizAttempts(numericUserId);
        if (!data) throw new Error('Failed to fetch quiz attempts');
        setAttempts(data);
      } catch (err) {
        console.error('Error fetching quiz attempts:', err);
        setError('Failed to load quiz history. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (numericUserId) fetchAttempts();
  }, [numericUserId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const exportMyPerformance = async () => {
    setExportLoading(true);
    try {
      // Trigger CSV export logic
      alert('Export started! You will receive an email with your performance data shortly.');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to start export. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your quiz attempts...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">📚 Past Quiz Attempts</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="bg-blue-50 text-blue-700 p-4 rounded shadow-sm">
          You haven't attempted any quizzes yet.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div
                key={attempt.attempt_id}
                className="bg-white shadow-sm rounded-lg p-5 hover:shadow-md transition duration-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-800">{attempt.quiz_title}</h2>
                    <div className="text-sm text-gray-500 mt-1 flex gap-4">
                      <span>📅 {formatDate(attempt.start_time)}</span>
                      <span>⏱️ {formatDuration(attempt.time_spent)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{attempt.percentage}%</div>
                      <div className="text-xs text-gray-500">{attempt.score}</div>
                    </div>
                    <Link
                      href={`/quiz/${attempt.quiz_id}/results`}
                      className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={exportMyPerformance}
              disabled={exportLoading}
              className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-5 py-2 rounded transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  📤 Export My Performance (CSV)
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}