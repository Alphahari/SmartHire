// types/Coding.ts
export interface CodingTopic {
  id: number;
  name: string;
  description: string;
  question_count?: number;
}

export interface CodingQuestion {
  id: number;
  title: string;
  description: string;
  constraints?: string;
  input_format?: string;
  output_format?: string;
  difficulty: string;
  topic_id: number;
  topic_name?: string;
  test_cases?: TestCase[];
}

export interface TestCase {
  id: number;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
  question_id?: number;
}