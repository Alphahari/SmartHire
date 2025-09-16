// app/subjects/[id]/chapters/[chapterId]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Quiz } from '@/types/Quiz';
import { fetchQuizzesByChapter } from '@/actions/QuizzesAPI';
import QuizList from '@/components/Quiz/QuizList';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import Link from 'next/link';

export default function ChapterPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState('');
  const params = useParams();
  const subjectId = parseInt(params.id as string);
  const chapterId = parseInt(params.chapterID as string);

  useEffect(() => {
    async function getQuizzes() {
      try {
        const data = await fetchQuizzesByChapter(chapterId);
        if (!data) {
          setError('Failed to fetch quizzes. Please try again later.');
        } else {
          setQuizzes(data || []);
          // Note: You might want to fetch chapter name separately
          // setChapterName(data.name);
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    if (chapterId) {
      getQuizzes();
    }
  }, [chapterId]);

  return (
    <UserProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link 
              href={`/subjects/${subjectId}`}
              className="text-blue-500 hover:text-blue-700 mb-2 inline-block"
            >
              &larr; Back to Chapters
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{chapterName}</h1>
            <p className="text-gray-600">Select a quiz to start practicing</p>
          </div>
          
          <QuizList 
            quizzes={quizzes} 
            loading={loading} 
            error={error}
            chapterId={chapterId}
          />
        </div>
      </div>
    </UserProtectedRoute>
  );
}