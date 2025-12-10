// types/MockTest.ts
export interface MockTest {
  id: number;
  name: string;
  description: string;
  quiz_id: number;
  quiz_name: string;
  coding_question_id: number;
  coding_question_title: string;
  coding_question_difficulty: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Fix: Add proper quiz and coding_question structure
export interface MockTestDetails {
  id: number;
  name: string;
  description: string;
  quiz: {
    id: number;
    remarks: string;
    duration: number;
    chapter_name: string;
    subject_name: string;
  };
  coding_question: {
    id: number;
    title: string;
    difficulty: string;
    description: string;
    constraints?: string;
    input_format?: string;
    output_format?: string;
  };
}

// Fix: Remove duplicate mock_test property
export interface MockTestAttempt {
  id: number;
  user_id: number;
  mock_test_id: number;
  quiz_score: number | null;
  coding_score: number | null;
  total_score: number | null;
  time_spent: number;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  user_name?: string;
}