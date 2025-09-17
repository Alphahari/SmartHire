export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  last_visited?: string;
  created_at?: string;
}