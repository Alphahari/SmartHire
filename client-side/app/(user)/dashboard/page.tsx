'use client';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fetchSubjects } from '@/actions/SubjectsAPI';
import { Subject } from '@/types/Subject';
import SubjectGrid from '@/components/Subject/SubjectGrid';
import UserStats from '@/components/UserComponents/UserStats';
import UserSidebar from '@/components/UserComponents/UserSidebar';

export default function UserDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('subjects');
  const { data: session } = useSession();

  useEffect(() => {
    async function getSubjects() {
      try {     
        const subs = await fetchSubjects();
        if (!subs) {
          setError('Failed to fetch subjects. Please try again later.');
        } else {
          setSubjects(subs);
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      getSubjects();
    }
  }, [session]);
  console.log(session)

  const renderContent = () => {
    switch (activeTab) {
      case 'subjects':
        return <SubjectGrid subjects={subjects} loading={loading} error={error} />;
      case 'stats':
        return <UserStats />;
      case 'progress':
        return <div>Progress Tracking - To be implemented</div>;
      default:
        return <SubjectGrid subjects={subjects} loading={loading} error={error} />;
    }
  };

  return (
    <UserProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {session?.user?.name}</h1>
            <p className="text-gray-600 mb-8">Continue your learning journey</p>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </UserProtectedRoute>
  );
}