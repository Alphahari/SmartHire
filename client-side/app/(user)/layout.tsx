// app/(user)/layout.tsx
'use client';

import UserSidebar from '@/components/UserComponents/UserSidebar';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </UserProtectedRoute>
  );
}