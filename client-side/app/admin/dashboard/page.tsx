import AdminProtectedRoute from '@/components/AdminProtectedRoute';

export default function AdminDashboard() {
  return (
    <AdminProtectedRoute>
      <div>
        <h1>Admin Dashboard</h1>
      </div>
    </AdminProtectedRoute>
  );
}