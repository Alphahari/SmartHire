'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadPdf } from '@/actions/InterviewAPI';

// --- Icons ---
const UploadIcon = () => (
  <svg className="w-10 h-10 text-indigo-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
);
const FileIcon = () => (
  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (selectedFile: File) => {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError('');
        } else {
            setError('Please upload a valid PDF file.');
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('pdf', file);
            const result = await uploadPdf(formData);
            if (result.success) router.push('/interview/ai/session');
            else setError(result.error || 'Failed to process PDF.');
        } catch (err) {
            setError('System error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Upload Syllabus</h2>
                    <p className="text-slate-500 mt-2">We'll analyze your PDF to generate a custom interview.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div 
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                            isDragging 
                                ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
                                : file 
                                    ? 'border-indigo-200 bg-indigo-50/30' 
                                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                        }`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="application/pdf"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                        
                        {file ? (
                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-indigo-100 animate-in fade-in zoom-in">
                                <FileIcon />
                                <span className="font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="text-slate-400 hover:text-red-500 ml-2"
                                >✕</button>
                            </div>
                        ) : (
                            <>
                                <UploadIcon />
                                <p className="text-sm font-semibold text-slate-600">Click to upload or drag & drop</p>
                                <p className="text-xs text-slate-400 mt-1">PDF files only (Max 10MB)</p>
                            </>
                        )}
                    </div>

                    {error && <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</div>}

                    <button
                        type="submit"
                        disabled={!file || isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform ${
                            !file || isLoading
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-1'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Analyzing Document...
                            </span>
                        ) : 'Start Interview'}
                    </button>
                </form>
            </div>
        </div>
    );
}