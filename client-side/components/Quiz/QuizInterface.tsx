// components/Quiz/QuizInterface.tsx
"use client"
import { Question } from '@/types/Question';
import { useEffect, useState } from 'react';

interface QuizInterfaceProps {
  questions: Question[];
  quizState: {
    currentQuestionIndex: number;
    answers: Record<number, number | null>;
    timeRemaining: number;
  };
  onAnswerSelect: (questionId: number, option: number) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onSubmit: () => void;
  onTimeUpdate: (timeRemaining: number) => void;
  submitting: boolean;
}

const QuizInterface = ({
  questions,
  quizState,
  onAnswerSelect,
  onNextQuestion,
  onPrevQuestion,
  onSubmit,
  onTimeUpdate,
  submitting
}: QuizInterfaceProps) => {
  const [localTime, setLocalTime] = useState(quizState.timeRemaining);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(prevTime => {
        if (prevTime <= 0) {
          clearInterval(timer);
          onSubmit();
          return 0;
        }
        const newTime = prevTime - 1;
        // onTimeUpdate(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSubmit, onTimeUpdate]);

  // Add null checks for current question
  const currentQuestion = questions[quizState.currentQuestionIndex];
  const selectedAnswer = currentQuestion ? quizState.answers[currentQuestion.id] : null;
  
  // Calculate progress percentage safely
  const answeredCount = Object.values(quizState.answers).filter(a => a !== null).length;
  const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Don't render question content if currentQuestion is undefined
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-10">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading questions...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">Quiz in Progress</h1>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">
                Question {quizState.currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="text-2xl font-bold text-warning bg-warning/10 px-3 py-1 rounded">
              Time: {formatTime(localTime)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">Instructions:</h3>
          <ul className="list-disc list-inside text-sm text-blue-700">
            <li>Answer all questions before time expires</li>
            <li>Answers are auto-saved</li>
            <li>You can navigate between questions using Previous and Next buttons</li>
          </ul>
        </div>

        {/* Question */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {currentQuestion.question_statement}
          </h3>
          
          {/* Options */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((option) => (
              <div
                key={option}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAnswer === option
                    ? 'bg-blue-100 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onAnswerSelect(currentQuestion.id, option)}
              >
                <div className="flex items-center">
                  <span className="font-bold mr-3">{String.fromCharCode(64 + option)}.</span>
                  <span>{currentQuestion[`option${option}` as keyof Question]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={onPrevQuestion}
            disabled={quizState.currentQuestionIndex === 0 || submitting}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
          >
            ← Previous
          </button>
          
          {quizState.currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded"
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </button>
          ) : (
            <button
              onClick={onNextQuestion}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;