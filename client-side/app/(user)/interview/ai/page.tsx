// app/(user)/interview/ai/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// --- Icons ---
const Icons = {
  Upload: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Robot: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
};

export default function AIInterviewLanding() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-6">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm mb-6">
            <Icons.Sparkles />
            <span>AI-Powered Assessment Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            How would you like to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">interview today?</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Our AI can generate a custom interview based on your specific study materials, 
            or challenge you with industry-standard questions.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Option 1: Custom Syllabus */}
          <button
            onClick={() => router.push('/interview/ai/upload')}
            onMouseEnter={() => setHoveredCard('upload')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 text-left flex flex-col h-full"
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-3xl transition-opacity duration-300 ${hoveredCard === 'upload' ? 'opacity-100' : 'opacity-0'}`} />
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Icons.Upload />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Upload Syllabus</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Upload a PDF of your course syllabus or job description. We'll generate a tailored interview that specifically targets your material.
              </p>
              
              <div className="mt-auto flex items-center text-indigo-600 font-semibold group-hover:gap-2 transition-all">
                <span>Upload PDF</span>
                <Icons.ArrowRight />
              </div>
            </div>
          </button>

          {/* Option 2: Default Interview */}
          <button
            onClick={() => router.push('/interview/ai/session')}
            onMouseEnter={() => setHoveredCard('default')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 text-left flex flex-col h-full"
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-3xl transition-opacity duration-300 ${hoveredCard === 'default' ? 'opacity-100' : 'opacity-0'}`} />
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Icons.Robot />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Quick Start</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Jump right into a general mock interview. Great for practicing standard behavioral and technical questions without specific prep.
              </p>
              
              <div className="mt-auto flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                <span>Start Session</span>
                <Icons.ArrowRight />
              </div>
            </div>
          </button>

        </div>
        
        {/* Footer Note */}
        <p className="text-center text-slate-400 text-sm mt-12">
          Trusted by candidates from top tech companies
        </p>

      </div>
    </div>
  );
}