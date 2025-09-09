'use server';

import { Subject } from "@/types/Subject";

export const fetchSubjects = async (): Promise<Subject[] | null> => {
  try {
    const res = await fetch('http://localhost:5000/api/subjects', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch subjects:', res.statusText);
      return null;
    }

    const data: Subject[] = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return null;
  }
};
