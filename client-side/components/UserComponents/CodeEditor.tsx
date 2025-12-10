// [file name]: CodeEditor.tsx
// [file content begin]
'use client';
import { useState, useEffect } from 'react';
import { CodingQuestion } from '@/types/Coding';
import dynamic from 'next/dynamic';
import { submitCode } from '@/actions/codeExecution';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  question: CodingQuestion;
}

interface TestCaseResult {
  status: 'PASSED' | 'FAILED' | 'ERROR';
  input: string;
  expected: string;
  output?: string;
  error?: string;
}

const boilerPlate = {
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read input here
        // Example: int n = scanner.nextInt();
        // Write your solution here
        
        scanner.close();
    }
}`,
  c: `#include <stdio.h>

int main() {
    // Read input here
    // Example: int n;
    // scanf("%d", &n);
    // Write your solution here
    
    return 0;
}`,
  py: `import sys

def main():
    # Read input here
    # Example: n = int(sys.stdin.readline())
    # Write your solution here
    pass

if __name__ == "__main__":
    main()`,
  cpp: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    // Read input here
    // Example: int n;
    // cin >> n;
    // Write your solution here
    
    return 0;
}`,
};

export default function CodeEditor({ question }: CodeEditorProps) {
  const [language, setLanguage] = useState<'py' | 'java' | 'cpp' | 'c'>('py');
  const [code, setCode] = useState<string>(boilerPlate.py);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<number | null>(null);
  const [customTestCases, setCustomTestCases] = useState<{ input: string; expected_output: string }[]>([]);

  // Initialize code based on language when question changes
  useEffect(() => {
    setCode(boilerPlate[language]);
    
    // Initialize with sample test cases
    if (question.test_cases) {
      const sampleCases = question.test_cases
        .filter(tc => tc.is_sample)
        .map(tc => ({
          input: tc.input_data,
          expected_output: tc.expected_output
        }));
      setCustomTestCases(sampleCases.length > 0 ? sampleCases : [{ input: '', expected_output: '' }]);
    } else {
      setCustomTestCases([{ input: '', expected_output: '' }]);
    }
    setResults([]);
  }, [question, language]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as 'py' | 'java' | 'cpp' | 'c';
    setLanguage(newLang);
    setCode(boilerPlate[newLang]);
  };

  const addTestCase = () => {
    setCustomTestCases([...customTestCases, { input: '', expected_output: '' }]);
  };

  const removeTestCase = (index: number) => {
    if (customTestCases.length > 1) {
      setCustomTestCases(customTestCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index: number, field: 'input' | 'expected_output', value: string) => {
    const updated = [...customTestCases];
    updated[index][field] = value;
    setCustomTestCases(updated);
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    setResults([]);

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

      setResults(JSON.parse(rawResult));
    } catch (error) {
      setResults([
        { 
          status: 'ERROR', 
          input: '', 
          expected: '',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearTestCases = () => {
    setCustomTestCases([{ input: '', expected_output: '' }]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="py">Python</option>
          </select>
          
          <button
            onClick={handleClearTestCases}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Clear Test Cases
          </button>
        </div>

        <button
          onClick={handleRunCode}
          disabled={isExecuting}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isExecuting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Run Code
        </button>
      </div>

      {/* Code Editor */}
      <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden">
        <Editor
          height="400px"
          language={language === 'py' ? 'python' : language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Custom Test Cases */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Custom Test Cases</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add test cases below. Input should match how it would be read from standard input.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Add a template test case
                setCustomTestCases([
                  ...customTestCases,
                  { 
                    input: '5\n1 2 3 4 5', 
                    expected_output: '15' 
                  }
                ]);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              + Template
            </button>
            <button
              onClick={addTestCase}
              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              + Add Test Case
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {customTestCases.map((testCase, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                    {index + 1}
                  </div>
                  <span className="ml-2 font-medium text-gray-700">Test Case {index + 1}</span>
                </div>
                {customTestCases.length > 1 && (
                  <button
                    onClick={() => removeTestCase(index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800 text-sm hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Input <span className="text-gray-500">(as read from stdin)</span>
                  </label>
                  <textarea
                    value={testCase.input}
                    onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    rows={3}
                    placeholder="Enter input values line by line"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Example: For array sum: "5\n1 2 3 4 5"
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Output <span className="text-gray-500">(exact format)</span>
                  </label>
                  <textarea
                    value={testCase.expected_output}
                    onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    rows={3}
                    placeholder="Enter expected output"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Example: "15" or "Hello World" or "1\n2\n3"
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Execution Results</h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  result.status === 'PASSED'
                    ? 'border-green-200 bg-green-50'
                    : result.status === 'FAILED'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {result.status === 'PASSED' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span className="font-medium">Test Case {index + 1}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      result.status === 'PASSED'
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'FAILED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                {result.error ? (
                  <div className="text-sm">
                    <div className="font-medium text-gray-700 mb-1">Error:</div>
                    <pre className="text-red-600 bg-white p-3 rounded border overflow-x-auto">
                      {result.error}
                    </pre>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Input</div>
                      <pre className="bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                        {result.input || <em className="text-gray-500">No input</em>}
                      </pre>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Expected</div>
                      <pre className="bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                        {result.expected}
                      </pre>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Your Output</div>
                      <pre className={`p-3 rounded border overflow-x-auto whitespace-pre-wrap ${
                        result.status === 'PASSED' ? 'bg-green-50' : 'bg-yellow-50'
                      }`}>
                        {result.output || <em className="text-gray-500">No output</em>}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// [file content end]