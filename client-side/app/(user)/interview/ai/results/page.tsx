'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InterviewResults } from '@/types/Interview';

// --- Components ---
const CircleChart = ({ score }: { score: number }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score > 80 ? 'text-emerald-500' : score > 50 ? 'text-amber-500' : 'text-rose-500';

    return (
        <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${color} transition-all duration-1000 ease-out`} />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-4xl font-bold ${color}`}>{score}</span>
                <span className="text-xs text-slate-400 uppercase font-bold">Score</span>
            </div>
        </div>
    );
};

const ResultCard = ({ title, content, type }: { title: string, content: string, type: 'success' | 'danger' | 'info' | 'warning' }) => {
    const styles = {
        success: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800', icon: '✅' },
        danger: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-800', icon: '⚠️' },
        info: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', icon: 'ℹ️' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-800', icon: '💡' },
    };
    const s = styles[type];

    return (
        <div className={`p-6 rounded-2xl border ${s.bg} ${s.border} h-full`}>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{s.icon}</span>
                <h3 className={`font-bold ${s.text} text-lg`}>{title}</h3>
            </div>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{content}</p>
        </div>
    );
};

export default function ResultsPage() {
    const [results, setResults] = useState<InterviewResults | null>(null);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('interviewResults');
        if (stored) setResults(JSON.parse(stored));
        else router.push('/interview/ai'); 
    }, [router]);

    if (!results) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header Card */}
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0">
                        <CircleChart score={results.final_score} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview Analysis Complete</h1>
                        <p className="text-slate-500 mb-6">Here is the comprehensive breakdown of your performance based on technical accuracy, communication clarity, and behavioral indicators.</p>
                        <div className="flex gap-4 justify-center md:justify-start">
                             <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-600">
                                 📅 {new Date().toLocaleDateString()}
                             </div>
                             <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-600">
                                 ⏱️ Session ID: #...{Math.floor(Math.random() * 1000)}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <ResultCard title="Executive Summary" content={results.summary} type="info" />
                    </div>
                    <ResultCard title="Key Strengths" content={results.strengths} type="success" />
                    <ResultCard title="Areas for Improvement" content={results.weaknesses} type="danger" />
                    <div className="md:col-span-2">
                        <ResultCard title="Actionable Suggestions" content={results.suggestions} type="warning" />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-center gap-4 pt-8">
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="px-8 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm"
                    >
                        Back to Dashboard
                    </button>
                    <button 
                        onClick={() => router.push('/interview/ai')}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                    >
                        Start New Session
                    </button>
                </div>

            </div>
        </div>
    );
}