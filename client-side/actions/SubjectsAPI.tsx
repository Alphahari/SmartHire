"use server"
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
// export const fetchSubjects = async (): Promise<Subject[] | null> => {
//   try {
//     const res = await fetch('http://localhost:5000/api/subjects', {
//       method: 'GET',
//       cache: 'no-store',
//       credentials: 'include',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!res.ok) {
//       console.error('Failed to fetch subjects:', res.statusText);
//       return null;
//     }

//     const data: Subject[] = await res.json();
//     return data;
//   } catch (error) {
//     console.error('Error fetching subjects:', error);
//     return null;
//   }
// };

export const addSubject = async (subjectData: Omit<Subject, 'id'>): Promise<Subject | null> => {
  try {
    const res = await fetch('http://localhost:5000/api/admin/subjects', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subjectData),
    });

    if (!res.ok) {
      console.error('Failed to add subject:', res.statusText);
      return null;
    }

    const data: Subject = await res.json();
    return data;
  } catch (error) {
    console.error('Error adding subject:', error);
    return null;
  }
};

export const updateSubject = async (id: string, subjectData: Partial<Subject>): Promise<Subject | null> => {
  try {
    const res = await fetch(`http://localhost:5000/api/admin/subjects/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subjectData),
    });

    if (!res.ok) {
      console.error('Failed to update subject:', res.statusText);
      return null;
    }

    const data: Subject = await res.json();
    return data;
  } catch (error) {
    console.error('Error updating subject:', error);
    return null;
  }
};

export const deleteSubject = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`http://localhost:5000/api/admin/subjects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('Failed to delete subject:', res.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting subject:', error);
    return false;
  }
};