// types/Quiz.ts
export interface Quiz {
  id: number;
  chapter_id: number;
  start_time: string;
  end_time: string;
  duration: number;
  remarks?: string;
}