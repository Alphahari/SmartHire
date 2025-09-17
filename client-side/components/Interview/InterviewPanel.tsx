// components/Interview/InterviewPanel.tsx
'use client';
import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

const InterviewPanel = () => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { data: session } = useSession();

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/user/resumes', {
        headers: {
          'Authorization': `Bearer ${session?.user.access_token}`
        }
      });
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const startInterview = async () => {
    if (!selectedResume) {
      alert('Please select a resume first');
      return;
    }

    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user.access_token}`
        },
        body: JSON.stringify({ resume_id: selectedResume })
      });
      
      const data = await response.json();
      setSessionId(data.session_id);
      setCurrentQuestion(data.question);
      setCurrentQuestionId(data.question_id);
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = sendAudio;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('session_id', sessionId!.toString());
    formData.append('question_id', currentQuestionId!.toString());
    formData.append('audio', audioBlob, 'response.wav');
    
    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.user.access_token}`
        },
        body: formData
      });
      
      if (response.ok) {
        // Poll for results (in a real app, you might use WebSockets or server-sent events)
        setTimeout(() => checkInterviewStatus(), 3000);
      }
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  const checkInterviewStatus = async () => {
    try {
      const response = await fetch(`/api/interview/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${session?.user.access_token}`
        }
      });
      
      const data = await response.json();
      const currentQuestionData = data.questions.find((q: any) => q.id === currentQuestionId);
      
      if (currentQuestionData && currentQuestionData.answer) {
        setFeedback(currentQuestionData.answer.feedback);
        
        // Get the next question
        const nextQuestion = data.questions.find((q: any) => q.order === currentQuestionData.order + 1);
        if (nextQuestion) {
          setCurrentQuestion(nextQuestion.question_text);
          setCurrentQuestionId(nextQuestion.id);
        }
      }
    } catch (error) {
      console.error('Error checking interview status:', error);
    }
  };

  return (
    <div className="interview-panel">
      <h2>AI Mock Interview</h2>
      
      {!sessionId ? (
        <div className="interview-setup">
          <h3>Select a Resume</h3>
          <button onClick={fetchResumes}>Load Resumes</button>
          <select 
            value={selectedResume} 
            onChange={(e) => setSelectedResume(e.target.value)}
          >
            <option value="">Select a resume</option>
            {resumes.map(resume => (
              <option key={resume.id} value={resume.id}>
                {resume.uploaded_at} - {resume.content.substring(0, 50)}...
              </option>
            ))}
          </select>
          <button onClick={startInterview}>Start Interview</button>
        </div>
      ) : (
        <div className="interview-session">
          <div className="question">{currentQuestion}</div>
          <div className="recording-controls">
            {!isRecording ? (
              <button onClick={startRecording}>Start Recording</button>
            ) : (
              <button onClick={stopRecording}>Stop Recording</button>
            )}
          </div>
          {feedback && (
            <div className="feedback">
              <h3>Feedback:</h3>
              <p>{feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewPanel;