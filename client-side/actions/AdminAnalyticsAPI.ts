// actions/AdminAnalyticsAPI.ts
'use server';

export interface SummaryStats {
  totalUsers: number;
  activeUsers: number;
  quizzesTaken: number;
  avgScore: number;
}

export interface UserGrowthData {
  labels: string[];
  values: number[];
}

export interface SubjectPerformanceData {
  labels: string[];
  values: number[];
}

export interface QuizActivityData {
  labels: string[];
  values: number[];
}

export interface PerformanceDistributionData {
  excellent: number;
  good: number;
  average: number;
  needs_improvement: number;
}

// Individual API calls instead of single summary call
export async function fetchTotalUsers(days?: number): Promise<number> {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/total-users${days ? `?days=${days}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch total users: ${response.statusText}`);
    }

    const data = await response.json();
    return data.totalUsers || 0;
  } catch (error) {
    console.error('Error fetching total users:', error);
    return 0;
  }
}

export async function fetchActiveUsers(days?: number): Promise<number> {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/active-users${days ? `?days=${days}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch active users: ${response.statusText}`);
    }

    const data = await response.json();
    return data.activeUsers || 0;
  } catch (error) {
    console.error('Error fetching active users:', error);
    return 0;
  }
}

export async function fetchQuizzesTaken(days?: number): Promise<number> {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/quizzes-taken${days ? `?days=${days}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quizzes taken: ${response.statusText}`);
    }

    const data = await response.json();
    return data.quizzesTaken || 0;
  } catch (error) {
    console.error('Error fetching quizzes taken:', error);
    return 0;
  }
}

export async function fetchAvgScore(days?: number): Promise<number> {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/avg-score${days ? `?days=${days}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch average score: ${response.statusText}`);
    }

    const data = await response.json();
    return data.avgScore || 0;
  } catch (error) {
    console.error('Error fetching average score:', error);
    return 0;
  }
}

// Combined summary for backward compatibility
export async function fetchSummaryStats(days?: number): Promise<SummaryStats> {
  try {
    const [totalUsers, activeUsers, quizzesTaken, avgScore] = await Promise.all([
      fetchTotalUsers(days),
      fetchActiveUsers(days),
      fetchQuizzesTaken(days),
      fetchAvgScore(days)
    ]);

    return {
      totalUsers,
      activeUsers,
      quizzesTaken,
      avgScore
    };
  } catch (error) {
    console.error('Error in fetchSummaryStats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      quizzesTaken: 0,
      avgScore: 0
    };
  }
}

export async function fetchUserGrowth(days?: number): Promise<UserGrowthData> {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/user-growth${days ? `?days=${days}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user growth data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    throw new Error('Failed to fetch user growth data');
  }
}

export async function fetchSubjectPerformance(): Promise<SubjectPerformanceData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/subject-performance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subject performance: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subject performance:', error);
    throw new Error('Failed to fetch subject performance');
  }
}

export async function fetchQuizActivity(days?: number): Promise<QuizActivityData> {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/quiz-activity${days ? `?days=${days}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quiz activity: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching quiz activity:', error);
    throw new Error('Failed to fetch quiz activity');
  }
}

export const fetchPerformanceDistribution = async (): Promise<PerformanceDistributionData> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/performance-distribution`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch performance distribution');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching performance distribution:', error);
    throw error;
  }
};