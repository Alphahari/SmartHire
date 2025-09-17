'use client';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import PastQuizzesContent from '@/components/UserComponents/PastQuizzesContent';
import Link from 'next/link';

export default function PastQuizzes() {
  return (
    <UserProtectedRoute>
      <div className="min-h-screen bg-gray-100 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
          <PastQuizzesContent />
        </div>
      </div>
    </UserProtectedRoute>
  );
}