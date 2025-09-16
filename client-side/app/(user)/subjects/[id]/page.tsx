// app/subjects/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Chapter } from '@/types/Chapter';
import { fetchChaptersBySubject } from '@/actions/ChaptersAPI';
import ChapterList from '@/components/Chapter/ChapterList';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';

export default function SubjectPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const params = useParams();
  const subjectId = parseInt(params.id as string);

  useEffect(() => {
    async function getChapters() {
      try {
        const data = await fetchChaptersBySubject(subjectId);
        if (!data) {
          setError('Failed to fetch chapters. Please try again later.');
        } else {
          setChapters(data || []);
          // setSubjectName(data.name);z
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    if (subjectId) {
      getChapters();
    }
  }, [subjectId]);

  return (
    <UserProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{subjectName}</h1>
            <p className="text-gray-600">Select a chapter to view available quizzes</p>
          </div>
          
          <ChapterList 
            chapters={chapters} 
            loading={loading} 
            error={error}
            subjectId={subjectId}
          />
        </div>
      </div>
    </UserProtectedRoute>
  );
}