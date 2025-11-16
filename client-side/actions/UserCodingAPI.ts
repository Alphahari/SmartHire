// actions/UserCodingAPI.ts
"use server"
import { CodingTopic, CodingQuestion } from '@/types/Coding';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_BASE_URL ? process.env.NEXT_PUBLIC_BASE_URL + "/api" : "http://localhost:5000/api";

export const fetchUserCodingTopics = async (): Promise<CodingTopic[]> => {
  const response = await fetch(`${API_BASE_URL}/coding/topics`, {
    credentials: 'include',
    cache: 'no-store'
  });
    
  if (!response.ok) {
    throw new Error('Failed to fetch coding topics');
  }
  
  return response.json();
};

export const fetchUserCodingQuestions = async (topicId: number): Promise<CodingQuestion[]> => {
  const response = await fetch(`${API_BASE_URL}/coding/questions?topic_id=${topicId}`, {
    credentials: 'include',
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch coding questions');
  }
  
  const data = await response.json();
  return data.questions || [];
};

export const fetchUserCodingQuestion = async (questionId: number): Promise<CodingQuestion> => {
  const response = await fetch(`${API_BASE_URL}/coding/questions/${questionId}`, {
    credentials: 'include',
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch coding question');
  }
  
  return response.json();
};