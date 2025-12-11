// actions/MockTestActions.ts
"use server";

import { MockTest, MockTestAttempt, MockTestDetails, MockTestSubmissionData } from "@/types/MockTest";

export async function fetchUserMockTests(): Promise<MockTest[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/mock-tests`, {
      credentials: 'include',
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch mock tests: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching mock tests:', error);
    throw error;
  }
}

export async function fetchMockTestDetails(id: number): Promise<MockTestDetails> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/mock-tests/${id}`, {
      credentials: 'include',
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch mock test details: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching mock test details:', error);
    throw error;
  }
}

export async function startMockTestAttempt(mockTestId: number, userId: number): Promise<{ attempt_id: number; started_at: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/mock-tests/${mockTestId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start mock test: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error starting mock test:', error);
    throw error;
  }
}

export const submitMockTestAttempt = async (attemptId: number, data: MockTestSubmissionData) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/mock-test-attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: data.user_id, // <--- Ensure this is sent
        quiz_score: data.quiz_score,
        coding_score: data.coding_score,
        time_spent: data.time_spent
      }),
    });

    if (!response.ok) {
      console.log(data)
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to submit mock test: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting mock test:', error);
    throw error;
  }
};

export interface AdminMockTest {
  id: number;
  name: string;
  description: string;
  quiz_id: number;
  quiz_name: string;
  coding_question_id: number;
  coding_question_title: string;
  is_active: boolean;
  created_at: string;
}

export async function fetchAdminMockTests(): Promise<AdminMockTest[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/mock-tests`, {
      credentials: 'include',
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch mock tests: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching mock tests:', error);
    throw error;
  }
}

export async function createMockTest(data: {
  name: string;
  description: string;
  quiz_id: number;
  coding_question_id: number;
  is_active: boolean;
}): Promise<AdminMockTest> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/mock-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create mock test: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating mock test:', error);
    throw error;
  }
}

export async function updateMockTest(id: number, data: Partial<AdminMockTest>) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/mock-tests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update mock test: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating mock test:', error);
    throw error;
  }
}

export async function deleteMockTest(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/mock-tests/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete mock test: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting mock test:', error);
    throw error;
  }
}