'use client';
import { useState, useEffect } from 'react';
import { CodingQuestion } from '@/types/Coding';
import dynamic from 'next/dynamic';
import { submitCode } from '@/actions/codeExecution';
import { Loader2, Play, Plus, Trash2, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  question: CodingQuestion;
  isMockTest?: boolean;
  onMockTestComplete?: (score: number) => void;
}

interface TestCaseResult {
  status: 'PASSED' | 'FAILED' | 'ERROR';
  input: string;
  expected: string;
  output?: string;
  error?: string;
}

// ... Keep boilerplate object same as before ...
const boilerPlate = {
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Write your solution here\n        scanner.close();\n    }\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  py: `import sys\n\ndef main():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    main()`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
};

export default function CodeEditor({ 
  question, 
  isMockTest = false, 
  onMockTestComplete 
}: CodeEditorProps) {
  const [language, setLanguage] = useState<'py' | 'java' | 'cpp' | 'c'>('py');
  const [code, setCode] = useState<string>(boilerPlate.py);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [customTestCases, setCustomTestCases] = useState<{ input: string; expected_output: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'cases' | 'results'>('cases');

  useEffect(() => {
    setCode(boilerPlate[language]);
    if (question.test_cases) {
      const sampleCases = question.test_cases
        .filter(tc => tc.is_sample)
        .map(tc => ({ input: tc.input_data, expected_output: tc.expected_output }));
      setCustomTestCases(sampleCases.length > 0 ? sampleCases : [{ input: '', expected_output: '' }]);
    } else {
      setCustomTestCases([{ input: '', expected_output: '' }]);
    }
    setResults([]);
    setActiveTab('cases');
  }, [question, language]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as 'py' | 'java' | 'cpp' | 'c';
    setLanguage(newLang);
    setCode(boilerPlate[newLang]);
  };

  const updateTestCase = (index: number, field: 'input' | 'expected_output', value: string) => {
    const updated = [...customTestCases];
    updated[index][field] = value;
    setCustomTestCases(updated);
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    setActiveTab('results');

    try {
      const formattedTestCases = customTestCases.map(tc => ({
        input: tc.input,
        expected_output: tc.expected_output
      }));

      const rawResult = await submitCode({
        lang: language,
        code,
        test_cases: formattedTestCases,
      });

      const resultsData = JSON.parse(rawResult);
      setResults(resultsData);

      // Calculate score for mock test
      if (isMockTest && onMockTestComplete && resultsData.length > 0) {
        const passedCount = resultsData.filter((r: any) => r.status === 'PASSED').length;
        const totalCount = resultsData.length;
        const score = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;

        // Show success message and auto-submit after delay
        if (score >= 70) { // You can adjust the threshold
          setTimeout(() => {
            onMockTestComplete(score);
          }, 2000);
        }
      }
    } catch (error) {
      setResults([{
        status: 'ERROR',
        input: '',
        expected: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Editor Toolbar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="py">Python 3</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>
        </div>

        <button
          onClick={handleRunCode}
          disabled={isExecuting}
          className="flex items-center px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExecuting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-2" />}
          Run Code
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative min-h-[300px]">
        <Editor
          height="100%"
          language={language === 'py' ? 'python' : language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Resizable Bottom Pane (Console) */}
      <div className="h-1/3 min-h-[250px] bg-white border-t border-slate-200 flex flex-col shadow-inner">
        {/* Console Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 text-sm font-medium flex items-center ${activeTab === 'cases'
                ? 'bg-white text-slate-800 border-t-2 border-t-blue-500'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Terminal className="w-3.5 h-3.5 mr-2" />
            Test Cases
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium flex items-center ${activeTab === 'results'
                ? 'bg-white text-slate-800 border-t-2 border-t-blue-500'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${results.length > 0 ? (results.some(r => r.status !== 'PASSED') ? 'bg-red-500' : 'bg-green-500') : 'bg-slate-300'}`} />
            Execution Results
          </button>
        </div>

        {/* Console Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'cases' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Inputs</span>
                <button
                  onClick={() => setCustomTestCases([...customTestCases, { input: '', expected_output: '' }])}
                  className="text-xs flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Case
                </button>
              </div>

              <div className="space-y-4">
                {customTestCases.map((tc, idx) => (
                  <div key={idx} className="group relative bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {customTestCases.length > 1 && (
                        <button onClick={() => setCustomTestCases(customTestCases.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Input</label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                          className="w-full text-sm font-mono bg-white border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-20"
                          placeholder="Standard input..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Expected Output</label>
                        <textarea
                          value={tc.expected_output}
                          onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                          className="w-full text-sm font-mono bg-white border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-20"
                          placeholder="Standard output..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[150px]">
                  <Play className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">Run your code to see results</p>
                </div>
              ) : (
                results.map((res, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className={`px-4 py-2 border-b border-slate-100 flex items-center justify-between ${res.status === 'PASSED' ? 'bg-green-50/50' : res.status === 'ERROR' ? 'bg-red-50/50' : 'bg-yellow-50/50'
                      }`}>
                      <div className="flex items-center gap-2">
                        {res.status === 'PASSED' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${res.status === 'PASSED' ? 'text-green-700' : 'text-red-700'
                          }`}>Test Case {idx + 1}</span>
                      </div>
                      <span className="text-xs font-mono font-medium opacity-70">{res.status}</span>
                    </div>

                    <div className="p-3 bg-white grid grid-cols-3 gap-4 text-xs font-mono">
                      {res.error ? (
                        <div className="col-span-3">
                          <div className="text-slate-500 mb-1">Error Message:</div>
                          <div className="text-red-600 bg-red-50 p-2 rounded border border-red-100 whitespace-pre-wrap">{res.error}</div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="text-slate-500 mb-1">Input:</div>
                            <div className="bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre">{res.input}</div>
                          </div>
                          <div>
                            <div className="text-slate-500 mb-1">Expected:</div>
                            <div className="bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre">{res.expected}</div>
                          </div>
                          <div>
                            <div className="text-slate-500 mb-1">Output:</div>
                            <div className={`p-2 rounded border whitespace-pre ${res.status === 'PASSED' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                              }`}>{res.output}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}