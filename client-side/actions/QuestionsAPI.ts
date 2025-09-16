"use server"
import { Question } from "@/types/Question";

export async function fetchQuestionsByQuiz(quizId: number) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/admin/quiz/${quizId}`,
      {
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }
    
    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error('Error fetching questions:', error);
    return null;
  }
}

export async function addQuestion(questionData: Omit<Question, 'id'>) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/quizzes/${questionData.quiz_id}/questions`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add question');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding question:', error);
    return null;
  }
}

export async function updateQuestion(id: string, questionData: Partial<Question>) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/questions/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update question');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating question:', error);
    return null;
  }
}

export async function deleteQuestion(id: string) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/questions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete question');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting question:', error);
    return false;
  }
}