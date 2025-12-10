'use client';
import { useState, useEffect } from 'react';
import { CodingTopic, CodingQuestion } from '@/types/Coding';
import { fetchUserCodingTopics, fetchUserCodingQuestions } from '@/actions/UserCodingAPI';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import CodingProblemDisplay from '@/components/UserComponents/CodingProblemDisplay';
import CodeEditor from '@/components/UserComponents/CodeEditor';

export default function UserCodingPage() {
  const [topics, setTopics] = useState<CodingTopic[]>([]);
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CodingTopic | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch topics on component mount
  useEffect(() => {
    fetchTopics();
  }, []);

  // Fetch questions when a topic is selected
  useEffect(() => {
    if (selectedTopic) {
      fetchQuestions(selectedTopic.id);
    }
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const data = await fetchUserCodingTopics();
      setTopics(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch coding topics');
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (topicId: number) => {
    try {
      setLoading(true);
      const data = await fetchUserCodingQuestions(topicId);
      setQuestions(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch coding questions');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: CodingTopic) => {
    setSelectedTopic(topic);
    setSelectedQuestion(null);
  };

  const handleQuestionSelect = (question: CodingQuestion) => {
    setSelectedQuestion(question);
  };

  if (loading && topics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4 mx-auto"></div>
          <div className="text-gray-600">Loading coding problems...</div>
        </div>
      </div>
    );
  }

  return (
    <UserProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Coding Practice</h1>
            <p className="text-gray-600">Improve your coding skills by solving problems</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Topics and Questions List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Topics</h2>
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicSelect(topic)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedTopic?.id === topic.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{topic.name}</div>
                      {topic.description && (
                        <div className="text-sm text-gray-500 mt-1">{topic.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {topic.question_count || 0} questions
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTopic && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Questions - {selectedTopic.name}
                  </h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {questions.map((question) => (
                      <button
                        key={question.id}
                        onClick={() => handleQuestionSelect(question)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedQuestion?.id === question.id
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="font-medium flex justify-between items-start">
                          <span>{question.title}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              question.difficulty === 'easy'
                                ? 'bg-green-100 text-green-800'
                                : question.difficulty === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {question.difficulty}
                          </span>
                        </div>
                        {/* Removed function signature display */}
                      </button>
                    ))}
                    {questions.length === 0 && !loading && (
                      <div className="text-center text-gray-500 py-4">
                        No questions available for this topic
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Main Content - Problem and Editor */}
            <div className="lg:col-span-2 space-y-6">
              {selectedQuestion ? (
                <>
                  <CodingProblemDisplay question={selectedQuestion} />
                  <CodeEditor question={selectedQuestion} />
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Question</h3>
                  <p className="text-gray-500">
                    Choose a topic and select a coding question to get started with your practice.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserProtectedRoute>
  );
}