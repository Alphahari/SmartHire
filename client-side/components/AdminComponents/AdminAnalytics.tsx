// components/AdminComponents/AdminAnalytics.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  fetchTotalUsers,
  fetchActiveUsers,
  fetchQuizzesTaken,
  fetchAvgScore,
  fetchUserGrowth,
  fetchSubjectPerformance,
  fetchQuizActivity,
  fetchPerformanceDistribution,
  UserGrowthData,
  SubjectPerformanceData,
  QuizActivityData,
  PerformanceDistributionData
} from '@/actions/AdminAnalyticsAPI';
import { 
  Users, 
  Activity, 
  FileCheck, 
  Trophy, 
  Calendar, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Filter
} from 'lucide-react';

// Adjusted colors to match the app's theme (Blue, Emerald, Amber, Purple)
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#7c3aed']; 

export default function AdminAnalytics() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [quizzesTaken, setQuizzesTaken] = useState<number>(0);
  const [avgScore, setAvgScore] = useState<number>(0);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData | null>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceData | null>(null);
  const [quizActivity, setQuizActivity] = useState<QuizActivityData | null>(null);
  const [performanceDistribution, setPerformanceDistribution] = useState<PerformanceDistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>('30');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const daysParam = timeFilter === 'all' ? undefined : parseInt(timeFilter);
      
      // Fetch all data in parallel
      const [
        totalUsersData,
        activeUsersData,
        quizzesTakenData,
        avgScoreData,
        userGrowthData,
        subjectPerformanceData,
        quizActivityData,
        performanceDistributionData
      ] = await Promise.all([
        fetchTotalUsers(daysParam),
        fetchActiveUsers(daysParam),
        fetchQuizzesTaken(daysParam),
        fetchAvgScore(daysParam),
        fetchUserGrowth(daysParam),
        fetchSubjectPerformance(),
        fetchQuizActivity(daysParam),
        fetchPerformanceDistribution()
      ]);

      setTotalUsers(totalUsersData);
      setActiveUsers(activeUsersData);
      setQuizzesTaken(quizzesTakenData);
      setAvgScore(avgScoreData);
      setUserGrowth(userGrowthData);
      setSubjectPerformance(subjectPerformanceData);
      setQuizActivity(quizActivityData);
      setPerformanceDistribution(performanceDistributionData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter]);

  // Data mapping
  const userGrowthChartData = userGrowth?.labels.map((label, index) => ({
    date: label,
    users: userGrowth.values[index]
  })) || [];

  const subjectPerformanceChartData = subjectPerformance?.labels.map((label, index) => ({
    subject: label,
    score: subjectPerformance.values[index]
  })) || [];

  const quizActivityChartData = quizActivity?.labels.map((label, index) => ({
    date: label,
    quizzes: quizActivity.values[index]
  })) || [];

  const performanceDistributionData = performanceDistribution ? [
    { name: 'Excellent', value: performanceDistribution.excellent },
    { name: 'Good', value: performanceDistribution.good },
    { name: 'Average', value: performanceDistribution.average },
    { name: 'Poor', value: performanceDistribution.needs_improvement }
  ] : [];

  // Summary Card Config
  const summaryCards = [
    { 
      title: 'Total Users', 
      value: totalUsers, 
      icon: <Users size={24} />, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      title: 'Active Users', 
      value: activeUsers, 
      icon: <Activity size={24} />, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      title: 'Quizzes Taken', 
      value: quizzesTaken, 
      icon: <FileCheck size={24} />, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      title: 'Average Score', 
      value: `${avgScore}%`, 
      icon: <Trophy size={24} />, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Gathering insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
          <AlertCircle className="text-red-500 mb-3" size={32} />
          <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Analytics</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics Dashboard</h2>
          <p className="text-slate-500 mt-1">Overview of platform performance and user engagement.</p>
        </div>
        
        {/* Styled Select Box */}
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors">
            <Calendar size={18} />
          </div>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Filter size={14} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp size={12} className="mr-1" />
                Live
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">User Growth</h3>
            <p className="text-sm text-slate-500">Registration trends over time</p>
          </div>
          <div className="h-72 w-full">
            {userGrowthChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No user growth data available
              </div>
            )}
          </div>
        </div>

        {/* Quiz Activity Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Quiz Activity</h3>
            <p className="text-sm text-slate-500">Daily assessment participation</p>
          </div>
          <div className="h-72 w-full">
            {quizActivityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizActivityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quizzes" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No quiz activity data available
              </div>
            )}
          </div>
        </div>

        {/* Subject Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Subject Performance</h3>
            <p className="text-sm text-slate-500">Average scores by category</p>
          </div>
          <div className="h-72 w-full">
            {subjectPerformanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="subject" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {subjectPerformanceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No subject performance data available
              </div>
            )}
          </div>
        </div>

        {/* Performance Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Score Distribution</h3>
            <p className="text-sm text-slate-500">Student performance tiers</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            {performanceDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {performanceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-600 text-sm ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No performance distribution data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}