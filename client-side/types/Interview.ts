// types/Interview.ts
export interface InterviewQuestion {
  answer: string;
  id: number;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

export interface InterviewResults {
  final_score: number;
  summary: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  total_questions: number;
}

export interface RecordingBlob {
  audioBlob: Blob;
  videoBlob: Blob;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}