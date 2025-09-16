"use server"
import { Quiz } from "@/types/Quiz";

export async function fetchQuizzesByChapter(chapterId: number) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/chapters/${chapterId}`,
      {
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch quizzes');
    }
    
    const data = await response.json();
    return data.quizzes || [];
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return null;
  }
}

export async function addQuiz(quizData: Omit<Quiz, 'id'>) {
  try {
    const response = await fetch('http://localhost:5000/api/admin/quizzes', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quizData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add quiz');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding quiz:', error);
    return null;
  }
}

export async function updateQuiz(id: string, quizData: Partial<Quiz>) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/quizzes/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quizData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update quiz');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating quiz:', error);
    return null;
  }
}

export async function deleteQuiz(id: string) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/quizzes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete quiz');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return false;
  }
}