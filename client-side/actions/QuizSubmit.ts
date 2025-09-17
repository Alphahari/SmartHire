// actions/QuizSubmit.ts
"use server"

export async function submitQuiz(quizId: number, answers: Record<number, number | null>, timeRemaining: number, userId: number) {
  try {
    const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers,
        time_remaining: timeRemaining,
        user_id: userId
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit quiz');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return null;
  }
}