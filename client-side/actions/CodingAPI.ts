// actions/CodingAPI.ts
"use server"
import { CodingTopic, CodingQuestion, TestCase } from '@/./types/Coding';

const API_BASE_URL : String = process.env.NEXT_PUBLIC_BASE_URL ? process.env.NEXT_PUBLIC_BASE_URL+"/api" : "http://localhost:5000/api"
console.log(API_BASE_URL)

export const fetchCodingTopics = async (): Promise<CodingTopic[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/topics`, {
    credentials: 'include',
  });
    
  if (!response.ok) {
    throw new Error('Failed to fetch coding topics');
  }
  
  return response.json();
};
export const addCodingTopic = async (data: { name: string; description: string }): Promise<CodingTopic> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/topics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add coding topic');
  }
  
  return response.json();
};

export const updateCodingTopic = async (id: string, data: { name: string; description: string }): Promise<CodingTopic> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/topics/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update coding topic');
  }
  
  return response.json();
};

export const deleteCodingTopic = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/topics/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete coding topic');
  }
  
  return true;
};

export const fetchCodingQuestionsByTopic = async (topicId: number): Promise<CodingQuestion[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/questions?topic_id=${topicId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch coding questions');
  }
  
  const data = await response.json();
  return data.questions || [];
};

export const addCodingQuestion = async (data: {
  title: string;
  description: string;
  constraints: string;
  input_format: string;
  output_format: string;
  difficulty: string;
  topic_id: number;
}): Promise<CodingQuestion> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add coding question');
  }
  
  return response.json();
};

export const updateCodingQuestion = async (id: string, data: {
  title: string;
  description: string;
  constraints: string;
  input_format: string;
  output_format: string;
  difficulty: string;
  topic_id: number;
}): Promise<CodingQuestion> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/questions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update coding question');
  }
  
  return response.json();
};

export const deleteCodingQuestion = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/questions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete coding question');
  }
  
  return true;
};

export const fetchTestCasesByQuestion = async (questionId: number): Promise<TestCase[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/questions/${questionId}/test-cases`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch test cases');
  }
  
  return response.json();
};

export const addTestCase = async (questionId: number, data: {
  input_data: string;
  expected_output: string;
  is_sample: boolean;
}): Promise<TestCase> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/questions/${questionId}/test-cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add test case');
  }
  
  return response.json();
};

export const updateTestCase = async (id: string, data: {
  input_data: string;
  expected_output: string;
  is_sample: boolean;
}): Promise<TestCase> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/test-cases/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update test case');
  }
  
  return response.json();
};

export const deleteTestCase = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/admin/coding/test-cases/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete test case');
  }
  
  return true;
};

export async function fetchAllCodingQuestions(page = 1, perPage = 100): Promise<{
  questions: CodingQuestion[];
  total: number;
  pages: number;
  current_page: number;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/coding/questions?page=${page}&per_page=${perPage}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch all coding questions');
  return response.json();
}