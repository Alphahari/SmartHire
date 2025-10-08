"use client";
import { useState } from "react";
import { submitCode } from '@/actions/codeExecution';
import dynamic from "next/dynamic";
import Button from '@/components/ui/button';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";

// Dynamically import Monaco Editor (disable SSR for client-side only)
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function CodeEditorPage() {
  const boilerPlate = {
    'java': "public class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println(\"Hello, Java!\");\n\t}\n}",
    'c': "#include <stdio.h>\n\nint main() {\n\tprintf(\"Hello, C!\\n\");\n\treturn 0;\n}",
    "py": "def main():\n\tprint(\"Hello, Python!\")\n\nif __name__ == '__main__':\n\tmain()",
    "cpp": "#include <iostream>\n\nusing namespace std;\n\nint main() {\n\tcout << \"Hello, C++!\" << endl;\n\treturn 0;\n}"
  };

  const [result, setResult] = useState<string[]>([]);
  const [language, setLanguage] = useState<"py" | "java" | "cpp" | "c">("py");
  const [codeExecuting, setCodeExecuting] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [code, setCode] = useState<string>(boilerPlate[language]);

  const languages = [
    { value: "py", label: "Python" },
    { value: "java", label: "Java" },
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
  ];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as "py" | "java" | "cpp" | "c";
    setLanguage(newLang);
    setCode(boilerPlate[newLang]);
  };

  const handleRunCode = async () => {
    setResult([]);
    setCodeExecuting(true);
    try {
      const result = await submitCode({
        lang: language,
        code: code
      });
      setResult(result.split("\n"));
    } catch (error) {
      setResult([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setCodeExecuting(false);
      setIsResultsOpen(true);
    }
  };

  const toggleResults = () => {
    setIsResultsOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex bg-white text-gray-900 overflow-hidden">
      {/* LEFT: Problem Description */}
      <div className="flex-1 p-4 border-r-2 border-gray-200 overflow-y-auto max-h-screen">
        <h1 className="text-3xl font-bold text-gray-800">Two Sum</h1>
        <p className="mt-4 text-lg text-gray-700">
          Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.<br />
          You may assume that each input would have exactly one solution, and you may not use the same element twice.<br />
          You can return the answer in any order.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-gray-800">Example Test Cases</h2>
        <pre className="mt-2 p-4 bg-gray-100 text-gray-800 rounded-md">
          Input: nums = [1, 2, 3], target = 4
          <br />
          Output: [0, 2]
        </pre>
      </div>
      <UserProtectedRoute>
        {/* RIGHT: Editor + Results */}
        <div className="flex-1 flex flex-col h-screen p-2 overflow-hidden">
          {/* Language Dropdown + Save Button */}
          <div className="mb-4 flex justify-between items-center">
            <select
              className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="" disabled>
                Select your language
              </option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="py">Python</option>
            </select>

            <button
              onClick={() => alert("Saved! Proceeding...")}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Save and Proceed
            </button>
          </div>

          {/* Editor + Results Container */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Code Editor */}
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden rounded-md ${isResultsOpen ? "basis-1/2" : "basis-full"
                }`}
            >
              <Editor
                language={language === "py" ? "python" : language}
                value={code}
                onChange={(newValue) => setCode(newValue || '')}
                theme="vs-dark"
                options={{
                  selectOnLineNumbers: true,
                  minimap: { enabled: false },
                }}
              />
            </div>

            {/* Test Results Panel */}
            <div
              className={`transition-all duration-500 ease-in-out bg-gray-100 text-gray-800 rounded-md mt-2 mb-2 overflow-auto ${isResultsOpen ? "basis-1/2 opacity-100" : "basis-0 opacity-0"
                }`}
            >
              <div className="p-2 h-full">
                <h2 className="text-xl font-semibold">Test Results</h2>
                <div className="rounded-md border bg-black text-white px-2 py-1 h-full flex flex-col">
                  <div className="font-mono text-sm flex-1 overflow-auto">
                    {result.length > 0 ? (
                      result.map((output, index) => (
                        <div key={index} className="mb-1">{output}</div>
                      ))
                    ) : (
                      <div className="text-gray-400">Run your code to see the output here</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle + Submit Controls */}
          <div className="flex justify-between items-center">
            <Button
              onClick={toggleResults}
              className="flex items-center text-gray-600 hover:text-gray-800 transition"
            >
              {isResultsOpen ? (
                <>
                  <ChevronDown className="mr-1" />
                  Hide Results
                </>
              ) : (
                <>
                  <ChevronUp className="mr-1" />
                  Show Results
                </>
              )}
            </Button>

            <Button
              disabled={codeExecuting}
              onClick={handleRunCode}
              className="bg-green-600 hover:bg-green-700 text-white text-lg font-bold"
            >
              {codeExecuting && <Loader2 className="animate-spin mr-2" size={10} />}
              Run Code
            </Button>
          </div>
        </div>
      </UserProtectedRoute>
    </div>
  );
}