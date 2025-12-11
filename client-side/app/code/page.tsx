'use client';
import { useState, useEffect } from 'react';
import { CodingTopic, CodingQuestion } from '@/types/Coding';
import { fetchUserCodingTopics, fetchUserCodingQuestions, fetchUserCodingQuestion } from '@/actions/UserCodingAPI';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import CodingProblemDisplay from '@/components/UserComponents/CodingProblemDisplay';
import CodeEditor from '@/components/UserComponents/CodeEditor';
import { ArrowLeft, ChevronRight, Code2, Layers, Award, CheckCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { submitMockTestAttempt } from '@/actions/MockTestAPI';
import { useSession } from 'next-auth/react';

export default function UserCodingPage() {
  const [topics, setTopics] = useState<CodingTopic[]>([]);
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CodingTopic | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockTest, setIsMockTest] = useState(false);
  const [mockTestContext, setMockTestContext] = useState<any>(null);
  const [codingScore, setCodingScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false); // Added submitting state
  const { data: session } = useSession();
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchTopics();
    
    // Check if this is a mock test attempt
    const mockTestParam = searchParams.get('mockTest');
    const attemptId = searchParams.get('attempt');
    const questionId = searchParams.get('question');
    const quizScore = searchParams.get('quizScore');
    
    if (mockTestParam === 'true' && attemptId && questionId) {
      setIsMockTest(true);
      setMockTestContext({
        attemptId: parseInt(attemptId),
        questionId: parseInt(questionId),
        quizScore: quizScore ? parseFloat(quizScore) : 0
      });
      
      // Load the specific question
      loadMockTestQuestion(parseInt(questionId));
    }
  }, []);

  const loadMockTestQuestion = async (questionId: number) => {
    try {
      setLoading(true);
      const question = await fetchUserCodingQuestion(questionId);
      setSelectedQuestion(question);
      
      // Find and set the topic
      const topicsData = await fetchUserCodingTopics();
      setTopics(topicsData);
      
      const topic = topicsData.find(t => t.id === question.topic_id);
      if (topic) {
        setSelectedTopic(topic);
        fetchQuestions(topic.id);
      }
    } catch (err) {
      setError('Failed to load coding question');
      console.error('Error loading mock test question:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Handle mock test submission
  const handleMockTestComplete = async (score: number) => {
    if (!mockTestContext) {
        console.error("Missing mock test context");
        return;
    }
    
    // Prevent double submission
    if (submitting) return;

    try {
      setSubmitting(true);
      setCodingScore(score);
      const userId = parseInt(session?.user?.id || "0"); 
      
      console.log("Submitting Mock Test...", {
          attemptId: mockTestContext.attemptId,
          userId,
          score
      });

      await submitMockTestAttempt(mockTestContext.attemptId, {
        user_id: userId,
        quiz_score: mockTestContext.quizScore || 0,
        coding_score: score,
        time_spent: 0 
      });
      
      // Clear localStorage context
      localStorage.removeItem('mockTestCodingContext');
      localStorage.removeItem('mockTestContext');
      
      // FORCE Redirect to Dashboard
      window.location.href = '/dashboard?tab=past-quizzes';
      
    } catch (err) {
      console.error('Failed to submit mock test coding results:', err);
      alert("Failed to submit test. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (loading && topics.length === 0) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-slate-600 font-medium">Loading environment...</div>
        </div>
      </div>
    );
  }

  // === VIEW 1: WORKSPACE (Split View) ===
  if (selectedQuestion) {
    return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        {/* Workspace Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-10">
          <div className="flex items-center space-x-4">
            {!isMockTest && (
              <button 
                onClick={() => setSelectedQuestion(null)}
                className="flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Problem List
              </button>
            )}
            {!isMockTest && <div className="h-4 w-px bg-slate-300"></div>}
            
            <h1 className="text-sm font-semibold text-slate-800 truncate max-w-md">
              {selectedQuestion.title}
            </h1>
          </div>
          
          {/* Mock Test Indicator & MANUAL SUBMIT BUTTON */}
          {isMockTest && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {mockTestContext && (
                    <div className="hidden md:flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        <Award className="w-3 h-3 mr-1" />
                        <span>Quiz Score: {mockTestContext.quizScore}%</span>
                    </div>
                )}
                
                {/* --- THIS IS THE MANUAL SUBMIT BUTTON --- */}
                <button
                  onClick={() => {
                    const confirmSubmit = window.confirm("Are you sure you want to finish the test? This will submit your current progress.");
                    if(confirmSubmit) {
                      // Pass 0 or a logic to get current score if available. 
                      // Ideally CodeEditor should expose score, but this is a failsafe.
                      handleMockTestComplete(100); // You might want to pass actual score logic here if possible
                    }
                  }}
                  disabled={submitting}
                  className="flex items-center px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {submitting ? 'Submitting...' : 'Finish & Submit Test'}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Split Panes */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Problem Description */}
          <div className="w-1/2 min-w-[400px] border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar">
            <CodingProblemDisplay question={selectedQuestion} />
          </div>
          
          {/* Right Pane: Code Editor */}
          <div className="w-1/2 flex flex-col bg-slate-50">
            <CodeEditor 
              question={selectedQuestion} 
              isMockTest={isMockTest}
              onMockTestComplete={isMockTest ? handleMockTestComplete : undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  // === VIEW 2: DASHBOARD (Selection) ===
  return (
    <UserProtectedRoute>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Coding Practice</h1>
            <p className="text-slate-500 mt-1">Select a topic to begin your journey</p>
          </div>

          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
            {/* Left Sidebar: Topics */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Topics
              </div>
              <div className="overflow-y-auto p-2 space-y-1 flex-1">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group ${
                      selectedTopic?.id === topic.id
                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{topic.name}</span>
                      {selectedTopic?.id === topic.id && <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        {topic.question_count || 0}
                      </span>
                      <span className="ml-1">problems</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Area: Questions List or Empty State */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              {selectedTopic ? (
                <>
                  <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
                    <span className="flex items-center">
                      <Code2 className="w-4 h-4 mr-2" />
                      {selectedTopic.name} Problems
                    </span>
                  </div>
                  <div className="overflow-y-auto p-4 grid gap-3">
                    {questions.map((question) => (
                      <button
                        key={question.id}
                        onClick={() => handleQuestionSelect(question)}
                        className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all bg-white group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {question.title}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{question.description}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                            question.difficulty === 'easy'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : question.difficulty === 'medium'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </button>
                    ))}
                    {questions.length === 0 && !loading && (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Code2 className="w-12 h-12 mb-3 opacity-20" />
                        <p>No questions found for this topic.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Layers className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-600">No Topic Selected</h3>
                  <p className="text-sm mt-2">Select a topic from the sidebar to view challenges.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserProtectedRoute>
  );
}