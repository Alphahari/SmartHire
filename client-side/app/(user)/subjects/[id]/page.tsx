'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchChaptersBySubject } from '@/actions/ChaptersAPI';
import { Chapter } from '@/types/Chapter';
import ChapterList from '@/components/Chapter/ChapterList';
import { ArrowLeft, BookOpen, ChevronRight, Search } from 'lucide-react';

export default function SubjectPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [subjectName, setSubjectName] = useState('Subject Modules'); 
  
  const params = useParams();
  const subjectId = parseInt(params.id as string);

  useEffect(() => {
    async function getChapters() {
      try {
        const data = await fetchChaptersBySubject(subjectId);
        if (!data) {
          setError('Failed to fetch chapters.');
        } else {
          setChapters(data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    if (subjectId) getChapters();
  }, [subjectId]);

  return (
    // FIX: Removed 'ml-72'. The layout handles the offset. 
    <div className="min-h-screen bg-gray-50">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <ChevronRight size={16} className="mx-2" />
            <Link href="/dashboard?tab=subjects" className="hover:text-indigo-600 transition-colors">My Subjects</Link>
            <ChevronRight size={16} className="mx-2" />
            <span className="font-semibold text-gray-800">{subjectName}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {/* FIX: Using max-w-7xl mx-auto to match InterviewPage style */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link 
              href="/dashboard?tab=subjects"
              className="group inline-flex items-center text-gray-500 hover:text-indigo-600 font-medium mb-4 transition-colors text-sm"
            >
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to All Subjects
            </Link>
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
              <span className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-md">
                <BookOpen size={30} />
              </span>
              {subjectName}
            </h1>
            <p className="text-xl text-gray-500 mt-3 ml-14">
              Explore chapters and master the concepts below.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search chapters..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>
        
        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 min-h-[400px]">
          {loading ? (
              <div className="space-y-4 animate-pulse">
               {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-50 rounded-xl border border-gray-100" />)}
              </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100 text-red-600">
              {error}
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                <BookOpen size={36} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No chapters found</h3>
              <p className="text-gray-500">This subject doesn't have any content yet.</p>
            </div>
          ) : (
            <ChapterList 
              chapters={chapters} 
              loading={loading} 
              error={error}
              subjectId={subjectId}
            />
          )}
        </div>
      </main>
    </div>
  );
}