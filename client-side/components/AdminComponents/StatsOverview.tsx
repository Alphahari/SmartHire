// components/AdminComponents/StatsOverview.tsx
import { Subject } from '@/types/Subject';
import { BookOpen, Users, CheckCircle2, TrendingUp, UserPlus, FileCheck, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchSummaryStats, SummaryStats } from '@/actions/AdminAnalyticsAPI';

interface StatsOverviewProps {
  subjects: Subject[];
  setActiveTab: (tab: string) => void;
}

const StatsOverview = ({ subjects, setActiveTab }: StatsOverviewProps) => {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await fetchSummaryStats(30); // Last 30 days
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Real-time stats cards
  const statsCards = [
    { 
      title: 'Total Subjects', 
      value: subjects.length, 
      icon: <BookOpen className="text-blue-600" size={24} />, 
      change: `+${subjects.length} available`, 
      bg: 'bg-blue-50',
      onClick: () => setActiveTab('subjects')
    },
    { 
      title: 'Total Users', 
      value: stats?.totalUsers || 0, 
      icon: <Users className="text-emerald-600" size={24} />, 
      change: 'Live count', 
      bg: 'bg-emerald-50',
      onClick: () => setActiveTab('users')
    },
    { 
      title: 'Quizzes Completed', 
      value: stats?.quizzesTaken || 0, 
      icon: <CheckCircle2 className="text-purple-600" size={24} />, 
      change: 'Recent activity', 
      bg: 'bg-purple-50',
      onClick: () => setActiveTab('analytics')
    },
    { 
      title: 'Average Score', 
      value: `${stats?.avgScore || 0}%`, 
      icon: <TrendingUp className="text-amber-600" size={24} />, 
      change: 'Overall performance', 
      bg: 'bg-amber-50',
      onClick: () => setActiveTab('analytics')
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Loading real-time stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Platform Overview</h2>
          <span className="text-sm text-slate-500">Last updated: Just now</span>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
          <AlertCircle className="text-red-500 mb-3" size={32} />
          <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Stats</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Platform Overview</h2>
        <span className="text-sm text-slate-500">Last updated: Just now</span>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <button
            key={index}
            onClick={stat.onClick}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow hover:border-blue-200 hover:ring-1 hover:ring-blue-100 text-left"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity - You can fetch real data here too */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
            <button 
              onClick={() => setActiveTab('analytics')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full mt-1">
                <UserPlus size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">New user registered</p>
                <p className="text-xs text-slate-500 mt-1">Sarah Jenkins joined the platform</p>
                <p className="text-xs text-slate-400 mt-1">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-2 rounded-full mt-1">
                <FileCheck size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Quiz completed</p>
                <p className="text-xs text-slate-500 mt-1">Frontend Basics - Score: 85%</p>
                <p className="text-xs text-slate-400 mt-1">15 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Add New Subject', icon: <BookOpen size={18} />, color: 'text-blue-600 bg-blue-50', tab: 'subjects' },
              { label: 'Manage Users', icon: <Users size={18} />, color: 'text-purple-600 bg-purple-50', tab: 'users' },
              { label: 'View Reports', icon: <BarChart3 size={18} />, color: 'text-amber-600 bg-amber-50', tab: 'analytics' },
              { label: 'Manage Coding', icon: <BookOpen size={18} />, color: 'text-green-600 bg-green-50', tab: 'coding' },
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => setActiveTab(action.tab)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    {action.icon}
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-slate-900">{action.label}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm group-hover:text-blue-600">
                  →
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;