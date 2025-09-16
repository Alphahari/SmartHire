"use server"
import { Chapter } from "@/types/Chapter";

export async function fetchChaptersBySubject(subjectId: number): Promise<Chapter[] | null> {
  try {
    const response = await fetch(`http://localhost:5000/api/subjects/${subjectId}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch chapters');
    }
    
    const data = await response.json();
    return data.chapters || []; // Extract chapters from the response
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return null;
  }
}
export async function addChapter(chapterData: Omit<Chapter, 'id'>) {
  try {
    const response = await fetch('http://localhost:5000/api/admin/chapters', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapterData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add chapter');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding chapter:', error);
    return null;
  }
}

export async function updateChapter(id: string, chapterData: Partial<Chapter>) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/chapters/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapterData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update chapter');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating chapter:', error);
    return null;
  }
}

export async function deleteChapter(id: string) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/chapters/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete chapter');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return false;
  }
}