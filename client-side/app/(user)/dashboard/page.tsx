"use client"
import UserProtectedRoute from '@/components/UserProtectedRoute';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Subject {
  id: number;
  name: string;
  description?: string;
}

export default function DashboardPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    async function getSubjects() {
      try {
        const res = await fetch('http://localhost:5000/api/subjects', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });

        if (!res.ok) {
          console.error('Failed to fetch subjects:', res.status);
          return;
        }

        const data = await res.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      getSubjects();
    }
  }, [session]);

  if (loading) {
    return (
      <UserProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white shadow rounded-lg p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </UserProtectedRoute>
    );
  }

  return (
    <UserProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">User Dashboard</h1>
        <hr className="mb-6 border-gray-300" />

        <h2 className="text-2xl font-semibold mb-4">Subjects</h2>

        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-white shadow rounded-lg p-4 border border-gray-200 hover:shadow-md transition"
              >
                <h3 className="text-lg font-bold text-center mb-2">
                  {subject.name}
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  {subject.description || 'No description'}
                </p>
              </div>
            ))}
          </div>

        ) : (
          <p className="text-gray-500 mt-4">No subjects found.</p>
        )}
      </div>
    </UserProtectedRoute>
  );
}