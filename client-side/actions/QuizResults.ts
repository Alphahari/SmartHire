// QuizResults.ts
"use server"
export async function fetchQuizAttempt(quizId: number, userId: number) {
  try {
    const response = await fetch(`http://localhost:5000/api/quizzes/attempt`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        user_id: userId,
        quiz_id: quizId 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quiz attempt');
    }

    const data = await response.json();
    
    // Handle case where no attempt exists
    if (!data.has_attempt) {
      return { has_attempt: false };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    return { error: 'Failed to fetch quiz attempt' };
  }
}

export async function fetchQuizResults(attemptId: number, userId: number) {
  try {
    const response = await fetch(`http://localhost:5000/api/quiz_attempts/${attemptId}/results`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quiz results');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return null;
  }
}

// Add these functions to your API files

// For QuizAttemptStatus
export async function fetchQuizAttemptStatus(chapterId: number, userId: number) {
  try {
    const response = await fetch(`http://localhost:5000/api/quizzes/attempts`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        user_id: userId,
        chapter_id: chapterId 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quiz attempt status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching quiz attempt status:', error);
    return null;
  }
}

// For UserQuizAttempts
export async function fetchUserQuizAttempts(userId: number) {
  try {
    const response = await fetch(`http://localhost:5000/api/user/quiz_attempts`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user quiz attempts');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user quiz attempts:', error);
    return null;
  }
}