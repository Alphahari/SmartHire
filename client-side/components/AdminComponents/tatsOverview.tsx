// components/StatsOverview.tsx
import { Subject } from '@/types/Subject';

interface StatsOverviewProps {
  subjects: Subject[];
}

const StatsOverview = ({ subjects }: StatsOverviewProps) => {
  const stats = [
    { title: 'Total Subjects', value: subjects.length, icon: '📚', change: '+2 since last month' },
    { title: 'Active Users', value: '1,234', icon: '👥', change: '+12% since last week' },
    { title: 'Quizzes Completed', value: '5,678', icon: '✅', change: '+8% since yesterday' },
    { title: 'Average Score', value: '72%', icon: '📊', change: '+3% from last month' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Platform Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-xs text-green-600 mt-2">{stat.change}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <span className="text-blue-600">👤</span>
              </div>
              <div>
                <p className="text-sm font-medium">New user registered</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <span className="text-green-600">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium">Quiz completed</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <span>Add New Subject</span>
              <span>➕</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <span>Manage Users</span>
              <span>👥</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <span>View Reports</span>
              <span>📈</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;