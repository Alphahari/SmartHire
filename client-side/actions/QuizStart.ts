// actions/QuizStart.ts
"use server"

export async function startQuiz(quizId: number, userId: number) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/quizzes/${quizId}/start`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to start quiz');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting quiz:', error);
    return null;
  }
}