// types/App.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}