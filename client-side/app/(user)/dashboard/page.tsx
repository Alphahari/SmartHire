'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { fetchSubjects } from '@/actions/SubjectsAPI';
import { Subject } from '@/types/Subject';
import SubjectGrid from '@/components/Subject/SubjectGrid';
import UserStats from '@/components/UserComponents/UserStats';
import PastQuizzesContent from '@/components/UserComponents/PastQuizzesContent';
import CodeEditorPage from '@/app/code/page';
import { Loader2 } from 'lucide-react';

export default function UserDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'subjects';

  // Greeting Logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    async function getSubjects() {
      try {        
        const subs = await fetchSubjects();
        if (!subs) setError('Failed to fetch subjects.');
        else setSubjects(subs);
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
    if (session) getSubjects();
  }, [session]);

  const renderContent = () => {
    switch (activeTab) {
      case 'subjects': return <SubjectGrid subjects={subjects} loading={loading} error={error} />;
      case 'stats': return <UserStats />;
      case 'past-quizzes': return <PastQuizzesContent />;
      case 'coding': return <CodeEditorPage />;
      default: return <SubjectGrid subjects={subjects} loading={loading} error={error} />;
    }
  };

  return (
    // FIX: Removed 'ml-64'/'ml-72'. Added 'max-w-7xl mx-auto' to match InterviewPage.
    <div className="min-h-screen bg-gray-50 transition-all duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {getGreeting()}, <span className="text-blue-600">{session?.user?.name?.split(' ')[0] || 'Learner'}</span> 👋
            </h1>
            <p className="text-gray-500 mt-1">Ready to continue your progress today?</p>
          </div>
          <div className="hidden md:block px-4 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-400 border border-gray-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
          {loading && activeTab === 'subjects' ? (
             <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
               <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-500" />
               <p>Loading...</p>
             </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}