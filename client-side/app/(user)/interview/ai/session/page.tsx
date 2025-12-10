'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { startInterviewSession, submitAnswer, getFinalScore } from '@/actions/InterviewAPI';

// --- Components ---

// Audio Wave Animation
const AudioWave = () => (
  <div className="flex items-center gap-1 h-6">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="w-1 bg-white rounded-full animate-music-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
    ))}
  </div>
);

const WebcamRecorder = ({ onRecordingComplete, isProcessing }: { onRecordingComplete: (audio: Blob, video: Blob) => void, isProcessing: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        async function setupCamera() {
            try {
                const ms = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
                setStream(ms);
                if (videoRef.current) videoRef.current.srcObject = ms;
            } catch (e) {
                console.error("Camera access denied:", e);
            }
        }
        setupCamera();
        return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            if (!stream) return;
            chunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                onRecordingComplete(blob, blob); 
            };
            recorder.start();
            setIsRecording(true);
            mediaRecorderRef.current = recorder;
        }
    };

    return (
        <div className="relative group w-full max-w-3xl mx-auto">
            {/* Main Video Feed */}
            <div className={`relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${isRecording ? 'ring-4 ring-rose-500 shadow-rose-500/20' : 'ring-1 ring-slate-700'}`}>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                
                {/* Overlay: Status Badges */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {isRecording && (
                        <div className="flex items-center gap-2 bg-rose-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full"></div> REC
                        </div>
                    )}
                </div>

                {/* Overlay: Processing State */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                        <p className="text-white font-medium">Analyzing Response...</p>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                <button
                    onClick={toggleRecording}
                    disabled={isProcessing || !stream}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 ${
                        isProcessing 
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : isRecording 
                                ? 'bg-rose-600 hover:bg-rose-700 text-white min-w-[200px] justify-center' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px] justify-center'
                    }`}
                >
                    {isProcessing ? 'Please wait' : isRecording ? (
                        <> <span className="w-3 h-3 bg-white rounded-sm"></span> Stop Recording </>
                    ) : (
                        <> <span className="w-3 h-3 bg-red-400 rounded-full"></span> Start Answer </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default function AIInterviewSession() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [feedback, setFeedback] = useState<string | null>(null);
    const MAX_QUESTIONS = 3; 

    useEffect(() => {
        const initSession = async () => {
            try {
                const data = await startInterviewSession();
                setSessionId(data.session_id);
                setCurrentQuestion(data.next_question);
                setQuestionCount(1);
            } catch (error) {
                alert('Connection failed. Please restart.');
            } finally {
                setLoading(false);
            }
        };
        initSession();
    }, []);

    const handleRecordingComplete = async (audioBlob: Blob, videoBlob: Blob) => {
        if (!sessionId) return;
        setProcessing(true);
        setFeedback(null);

        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('question', currentQuestion);
        formData.append('audio', audioBlob, 'audio.webm');
        formData.append('video', videoBlob, 'video.webm');

        try {
            const result = await submitAnswer(formData);
            if (result.success) {
                if (questionCount >= MAX_QUESTIONS) {
                    const results = await getFinalScore(sessionId);
                    localStorage.setItem('interviewResults', JSON.stringify(results));
                    router.push('/interview/ai/results');
                } else {
                    setFeedback(result.feedback);
                    setTimeout(() => {
                        setFeedback(null);
                        setCurrentQuestion(result.next_question);
                        setQuestionCount(prev => prev + 1);
                    }, 5000);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-indigo-400 font-mono animate-pulse">Establishing Secure Connection...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="font-mono text-sm text-slate-400">LIVE SESSION</span>
                </div>
                <div className="flex gap-1">
                    {[...Array(MAX_QUESTIONS)].map((_, i) => (
                        <div key={i} className={`h-2 w-8 rounded-full transition-all ${i + 1 <= questionCount ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center p-6 max-w-6xl mx-auto w-full gap-8">
                
                {/* Question Card */}
                <div className="w-full text-center space-y-4 py-8">
                    <span className="text-indigo-400 font-bold tracking-wider text-sm uppercase">Question {questionCount} of {MAX_QUESTIONS}</span>
                    <h1 className="text-3xl md:text-4xl font-bold leading-tight max-w-4xl mx-auto transition-all duration-500">
                        {currentQuestion}
                    </h1>
                </div>

                {/* Webcam Stage */}
                <WebcamRecorder onRecordingComplete={handleRecordingComplete} isProcessing={processing} />

                {/* AI Feedback Overlay (Toast Style) */}
                {feedback && (
                    <div className="fixed bottom-8 right-8 max-w-md bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500 z-50">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">AI Analysis</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">{feedback}</p>
                                <div className="mt-3 text-xs text-indigo-400 flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                    Preparing next question...
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}