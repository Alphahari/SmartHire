'use client';

import { useState, useEffect } from 'react';

interface UserStat {
  title: string;
  value: string | number;
  change: string;
  icon: string;
}

const UserStats = () => {
  const [stats, setStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setTimeout(() => {
        setStats([
          { title: 'Quizzes Completed', value: 12, change: '+20% from last month', icon: '✅' },
          { title: 'Average Score', value: '78%', change: '+5% from last week', icon: '📊' },
          { title: 'Learning Hours', value: '24.5', change: '+3.5h from last week', icon: '⏱️' },
          { title: 'Subjects Mastered', value: 3, change: '1 new this month', icon: '🎯' },
        ]);
        setLoading(false);
      }, 1000);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-md">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Learning Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-gray-500">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="bg-green-100 p-2 rounded-full mr-4">
              <span className="text-green-600">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium">Completed "Algebra Basics" quiz</p>
              <p className="text-xs text-gray-500">Scored 85% - 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full mr-4">
              <span className="text-blue-600">📚</span>
            </div>
            <div>
              <p className="text-sm font-medium">Started "Geometry Fundamentals"</p>
              <p className="text-xs text-gray-500">Yesterday at 3:45 PM</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="bg-purple-100 p-2 rounded-full mr-4">
              <span className="text-purple-600">🏆</span>
            </div>
            <div>
              <p className="text-sm font-medium">Earned "Math Whiz" badge</p>
              <p className="text-xs text-gray-500">3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;