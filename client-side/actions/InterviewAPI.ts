// actions/InterviewAPI.ts
'use server';

const API_BASE_URL = 'http://localhost:5054/api/interview';

export async function startInterviewSession() {
  try {
    const response = await fetch(`${API_BASE_URL}/start-session`, {
      method: 'POST',
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Failed to start session');
    return await response.json();
  } catch (err) {
    console.error('Error starting session:', err);
    throw err;
  }
}

export async function submitAnswer(formData: FormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-answer`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to submit answer');
    return await response.json();
  } catch (err) {
    console.error('Error submitting answer:', err);
    throw err;
  }
}

export async function getFinalScore(sessionId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/final-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) throw new Error('Failed to get final score');
    return await response.json();
  } catch (err) {
    console.error('Error getting final score:', err);
    throw err;
  }
}

export async function uploadPdf(formData: FormData) {
  try {
    const response = await fetch('http://localhost:5054/api/interview/upload-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error submitting answers:', err);
    // Fix the error reference here
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    throw new Error(`Failed to submit interview answers: ${errorMessage}`);
  }
}