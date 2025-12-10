// app/(user)/interview/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// --- Types ---
interface InterviewQuestion {
  id: number;
  question: string;
  category: 'technical' | 'behavioral' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in minutes
}

// --- Icons (Inline SVGs for copy-paste portability) ---
const Icons = {
  Clock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Play: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
};

// --- Helper Components ---
const DifficultyBadge = ({ level }: { level: string }) => {
  const colors = {
    easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    hard: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[level as keyof typeof colors] || 'bg-gray-100'}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colors = {
    technical: 'bg-indigo-100 text-indigo-700',
    behavioral: 'bg-purple-100 text-purple-700',
    'system-design': 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${colors[category as keyof typeof colors] || 'bg-gray-100'}`}>
      {category}
    </span>
  );
};

export default function InterviewPage() {
  const { data: session } = useSession();
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewState, setViewState] = useState<'browsing' | 'active' | 'summary'>('browsing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Data
  const interviewQuestions: InterviewQuestion[] = [
    { id: 1, question: "Tell me about yourself and your experience with programming.", category: 'behavioral', difficulty: 'easy', timeLimit: 3 },
    { id: 2, question: "Explain the concept of object-oriented programming.", category: 'technical', difficulty: 'medium', timeLimit: 5 },
    { id: 3, question: "How would you optimize a slow database query?", category: 'technical', difficulty: 'hard', timeLimit: 7 },
    { id: 4, question: "Describe a time when you missed a deadline.", category: 'behavioral', difficulty: 'medium', timeLimit: 4 },
    { id: 5, question: "Async/await vs Promises in JavaScript?", category: 'technical', difficulty: 'medium', timeLimit: 5 },
    { id: 6, question: "Design a URL shortening service like Bit.ly", category: 'system-design', difficulty: 'hard', timeLimit: 15 },
  ];

  // Filtering
  const filteredQuestions = interviewQuestions.filter(q => {
    const categoryMatch = selectedCategory === 'all' || q.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  // Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (viewState === 'active' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [viewState, timeLeft]);

  // Handlers
  const startInterview = () => {
    if (filteredQuestions.length === 0) return;
    setCurrentQuestionIndex(0);
    setViewState('active');
    setUserAnswer('');
    setTimeLeft(filteredQuestions[0].timeLimit * 60);
  };

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer('');
      setTimeLeft(filteredQuestions[nextIndex].timeLimit * 60);
    } else {
      setViewState('summary');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Views ---

  // 1. Summary View
  if (viewState === 'summary') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Interview Completed!</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Great job practicing. You covered {filteredQuestions.length} questions regarding {selectedCategory === 'all' ? 'various topics' : selectedCategory}.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setViewState('browsing')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center gap-2"
            >
              Back to Dashboard
            </button>
            <button
              onClick={startInterview}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              <Icons.Refresh /> Restart Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Interview View
  if (viewState === 'active') {
    const progress = ((currentQuestionIndex + 1) / filteredQuestions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header / Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Question {currentQuestionIndex + 1} of {filteredQuestions.length}</p>
              <div className="flex gap-3">
                <DifficultyBadge level={currentQuestion.difficulty} />
                <CategoryBadge category={currentQuestion.category} />
              </div>
            </div>
            <div className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-2xl font-bold text-gray-800 leading-snug">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="p-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">Your Answer</label>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 resize-none font-sans text-lg leading-relaxed shadow-sm"
              placeholder="Structure your thoughts here..."
              autoFocus
            />
          </div>

          <div className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-100">
            <button
              onClick={() => setViewState('browsing')}
              className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2 hover:bg-gray-200 rounded-lg transition"
            >
              Quit
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {currentQuestionIndex === filteredQuestions.length - 1 ? 'Finish Interview' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Browsing / Dashboard View
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Mock Interview Studio</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Refine your technical communication skills with timed, categorized practice questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </span>
              <h2 className="text-lg font-bold text-gray-800">Configuration</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  <option value="all">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="system-design">System Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  <option value="all">Mixed Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={startInterview}
                  disabled={filteredQuestions.length === 0}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2
                    ${filteredQuestions.length > 0 
                      ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200' 
                      : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  <Icons.Play />
                  Start Session ({filteredQuestions.length})
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Tips Box */}
          <div className="mt-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span> Pro Tips
            </h4>
            <ul className="text-sm text-indigo-800 space-y-2">
              <li>• Use the STAR method for stories.</li>
              <li>• Think out loud while coding.</li>
              <li>• Clarify requirements first.</li>
            </ul>
          </div>
        </div>

        {/* Question Grid */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Question Bank
            </h2>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              Showing {filteredQuestions.length} questions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <div className="text-indigo-500"><Icons.Play /></div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <CategoryBadge category={q.category} />
                  <DifficultyBadge level={q.difficulty} />
                </div>
                
                <h3 className="font-semibold text-gray-800 mb-4 line-clamp-2 min-h-[3rem]">
                  {q.question}
                </h3>
                
                <div className="flex items-center text-sm text-gray-400 gap-2 mt-auto pt-4 border-t border-gray-50">
                  <Icons.Clock />
                  <span>{q.timeLimit} min allocation</span>
                </div>
              </div>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your category or difficulty filters.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedDifficulty('all'); }}
                className="text-indigo-600 font-medium hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}