'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fetchSubjects } from '@/actions/SubjectsAPI';
import { Subject } from '@/types/Subject';
import AdminProtectedRoute from '@/components/AdminComponents/AdminProtectedRoute';
import AdminSidebar from '@/components/AdminComponents/AdminSidebar';
import StatsOverview from '@/components/AdminComponents/StatsOverview';
import SubjectManagement from '@/components/Subject/SubjectManagement';
import UserManagement from '@/components/AdminComponents/UserManagement';
import AdminAnalytics from '@/components/AdminComponents/AdminAnalytics';

export default function AdminDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { data: session } = useSession();

  // ✅ Extracted fetch function for reuse
  const getSubjects = async () => {
    try {
      setLoading(true);
      const subs = await fetchSubjects();
      if (!subs) {
        setError('Failed to fetch subjects. Please try again later.');
      } else {
        setSubjects(subs);
        setError(null);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reuse getSubjects in useEffect
  useEffect(() => {
    if (session) {
      getSubjects();
    }
  }, [session]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StatsOverview subjects={subjects} />;
      case 'subjects':
        return (
          <SubjectManagement 
            subjects={subjects} 
            loading={loading} 
            error={error} 
            onSubjectChange={getSubjects}
          />
        );
      case 'users':
        return <UserManagement onUserChange={getSubjects} />;
      case 'analytics':
        return <AdminAnalytics />; // Add this line
      default:
        return <StatsOverview subjects={subjects} />;
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 mb-8">Manage your platform efficiently</p>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
