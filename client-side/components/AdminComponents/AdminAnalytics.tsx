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
  fetchSummaryStats,
  fetchUserGrowth,
  fetchSubjectPerformance,
  fetchQuizActivity,
  fetchPerformanceDistribution,
  SummaryStats,
  UserGrowthData,
  SubjectPerformanceData,
  QuizActivityData,
  PerformanceDistributionData
} from '@/actions/AdminAnalyticsAPI';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminAnalytics() {
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
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
      
      // Convert timeFilter to number or undefined for "all"
      const daysParam = timeFilter === 'all' ? undefined : parseInt(timeFilter);
      
      // Fetch all analytics data in parallel
      const [
        summaryData,
        userGrowthData,
        subjectPerformanceData,
        quizActivityData,
        performanceDistributionData
      ] = await Promise.all([
        fetchSummaryStats(daysParam),
        fetchUserGrowth(daysParam),
        fetchSubjectPerformance(),
        fetchQuizActivity(daysParam),
        fetchPerformanceDistribution()
      ]);

      setSummaryStats(summaryData);
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

  // Prepare data for charts
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
    { name: 'Excellent (90-100%)', value: performanceDistribution.excellent },
    { name: 'Good (75-89%)', value: performanceDistribution.good },
    { name: 'Average (60-74%)', value: performanceDistribution.average },
    { name: 'Needs Improvement (<60%)', value: performanceDistribution.needs_improvement }
  ] : [];

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Analytics Dashboard</h2>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md h-80">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Analytics Dashboard</h2>
        <div className="p-4 text-red-500">{error}</div>
        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Analytics Dashboard</h2>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summaryStats?.totalUsers || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summaryStats?.activeUsers || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-500">Quizzes Taken</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summaryStats?.quizzesTaken || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summaryStats?.avgScore || 0}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Activity Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiz Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quizActivityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quizzes" stroke="#FF8042" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent as number * 100).toFixed(0)}%`}
                >
                  {performanceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}