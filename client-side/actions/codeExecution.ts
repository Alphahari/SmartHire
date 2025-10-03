// actions/codeExecution.ts
'use server';

interface submissionInterface {
  lang: string;
  code: string;
}

export async function submitCode(submission: submissionInterface) {
  try {
    const response = await fetch('http://localhost:3000/api/submission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.output;
  } catch (error) {
    console.error('Error submitting code:', error);
    throw new Error(`Failed to execute code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}