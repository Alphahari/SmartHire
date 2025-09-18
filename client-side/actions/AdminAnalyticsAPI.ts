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

export async function fetchSummaryStats(days?: number): Promise<SummaryStats> {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/summary${days ? `?days=${days}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch summary stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    throw new Error('Failed to fetch summary stats');
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

export async function fetchPerformanceDistribution(): Promise<PerformanceDistributionData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/stats/performance-distribution`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch performance distribution: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      excellent: data[0] || 0,
      good: data[1] || 0,
      average: data[2] || 0,
      needs_improvement: data[3] || 0
    };
  } catch (error) {
    console.error('Error fetching performance distribution:', error);
    throw new Error('Failed to fetch performance distribution');
  }
}