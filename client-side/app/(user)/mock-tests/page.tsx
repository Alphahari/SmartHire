'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import { fetchUserMockTests, startMockTestAttempt } from '@/actions/MockTestAPI';
import { MockTest } from '@/types/MockTest';

export default function MockTestsPage() {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    loadMockTests();
  }, []);

  const loadMockTests = async () => {
    try {
      setLoading(true);
      const tests = await fetchUserMockTests();
      setMockTests(tests);
    } catch (err) {
      setError('Failed to load mock tests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startMockTest = async (mockTestId: number) => {
    try {
      if (!session?.user?.id) {
        setError('User not authenticated');
        return;
      }
      
      const result = await startMockTestAttempt(mockTestId, parseInt(session.user.id));
      
      // Navigate to the mock test attempt page
      router.push(`/mock-tests/${mockTestId}/attempt/${result.attempt_id}`);
      
    } catch (err) {
      setError('Failed to start mock test');
      console.error(err);
    }
  };
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3">Loading mock tests...</p>
        </div>
      </div>
    );
  }

  return (
    <UserProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mock Tests</h1>
                <p className="text-gray-600">
                  Complete hiring process simulations including quiz and coding challenges
                </p>
              </div>
              <button
                onClick={() => router.push('/interview/ai/upload')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
              >
                📄 Upload PDF for AI Interview
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTests.map(test => (
              <div key={test.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{test.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      test.coding_question_difficulty === 'easy'
                        ? 'bg-green-100 text-green-800'
                        : test.coding_question_difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {test.coding_question_difficulty}
                    </span>
                  </div>
                  
                  {test.description && (
                    <p className="text-gray-600 mb-4">{test.description}</p>
                  )}
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">📝</span>
                      <span className="text-sm text-gray-700">Quiz: {test.quiz_name || `Quiz #${test.quiz_id}`}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">💻</span>
                      <span className="text-sm text-gray-700">Coding: {test.coding_question_title}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startMockTest(test.id)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Start Mock Test
                  </button>
                </div>
              </div>
            ))}
            
            {mockTests.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Mock Tests Available</h3>
                <p className="text-gray-500">
                  Mock tests will appear here once created by the admin.
                </p>
              </div>
            )}
          </div>

          {/* AI Interview Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready for a Real Interview?</h2>
                <p className="text-gray-600 mb-4">
                  Upload your syllabus or resume to generate a personalized AI-powered interview with instant feedback.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/interview/ai/upload')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    📄 Upload PDF & Start AI Interview
                  </button>
                  <button
                    onClick={() => router.push('/interview/ai')}
                    className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                  >
                    🤖 Try Default AI Interview
                  </button>
                </div>
              </div>
              <div className="text-gray-400">
                <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserProtectedRoute>
  );
}