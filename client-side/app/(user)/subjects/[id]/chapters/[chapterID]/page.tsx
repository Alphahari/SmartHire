'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchQuizzesByChapter } from '@/actions/QuizzesAPI';
import { Quiz } from '@/types/Quiz';
import QuizList from '@/components/Quiz/QuizList';
import { ArrowLeft, ChevronRight, FileQuestion, Trophy } from 'lucide-react';

export default function ChapterPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Placeholder for chapter name until API supports it
  const [chapterName, setChapterName] = useState('Chapter Quizzes'); 
  
  const params = useParams();
  const subjectId = parseInt(params.id as string);
  const chapterId = parseInt(params.chapterID as string); 

  useEffect(() => {
    async function getQuizzes() {
      try {
        const data = await fetchQuizzesByChapter(chapterId);
        if (!data) {
          setError('Failed to fetch quizzes.');
        } else {
          setQuizzes(data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    if (chapterId) getQuizzes();
  }, [chapterId]);

  return (
    // FIX: Removed 'ml-72'. Added standard background.
    <div className="min-h-screen bg-gray-50">
      
      {/* Breadcrumb Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <ChevronRight size={16} className="mx-2" />
            <Link href={`/subjects/${subjectId}`} className="hover:text-indigo-600 transition-colors">Subject</Link>
            <ChevronRight size={16} className="mx-2" />
            <span className="font-medium text-gray-800">Quizzes</span>
          </div>
        </div>
      </header>

      {/* Main Content - Centered with max-w-7xl */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <Link 
            href={`/subjects/${subjectId}`}
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm hover:bg-white/20"
          >
            <ArrowLeft size={14} className="mr-2" />
            Back to Chapters
          </Link>
          
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold mb-2 tracking-tight">{chapterName}</h1>
              <p className="text-blue-100 max-w-xl text-lg">
                Ready to test your knowledge? Select a quiz below to start practicing.
                Good luck!
              </p>
            </div>
            <div className="hidden md:block">
               <Trophy size={64} className="text-yellow-300 drop-shadow-lg opacity-90" />
            </div>
          </div>
        </div>

        {/* Quiz List Container */}
        <div>
           <div className="flex items-center justify-between mb-6 px-1">
             <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                 <FileQuestion size={24} />
               </span>
               Available Assessments
             </h2>
             <span className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
               {quizzes.length} Quizzes
             </span>
           </div>

           <div className="space-y-4">
             {loading ? (
                <div className="grid grid-cols-1 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse shadow-sm" />
                  ))}
                </div>
             ) : (
                <QuizList 
                  quizzes={quizzes}
                  loading={loading}
                  error={error}
                  chapterId={chapterId}
                  userId={0}
                />
             )}
           </div>
        </div>
      </main>
    </div>
  );
}