export interface Question {
  id: number;
  quiz_id: number;
  question_statement: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: number;
}