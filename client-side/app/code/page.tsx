'use client';

import { useState } from 'react';
import { submitCode } from '@/actions/codeExecution';
import Button from '@/components/ui/button';
import { Loader2, TerminalIcon } from 'lucide-react';
import UserProtectedRoute from '@/components/UserComponents/UserProtectedRoute';
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false, 
  loading: () => <div className="h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center">Loading editor...</div>
});

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
    }
  };

  return (
    <UserProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Code Editor</h1>
        
        <div className="flex gap-4 mb-4">
          <select 
            value={language} 
            onChange={handleLanguageChange}
            className="p-2 border rounded-md"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          
          <Button 
            disabled={codeExecuting} 
            onClick={handleRunCode}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {codeExecuting && <Loader2 className="animate-spin mr-2" size={16} />}
            Run Code
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md overflow-hidden border">
            <Editor 
              height="70vh"
              value={code}
              theme="vs-dark"
              options={{
                fontSize: 16,
                lineHeight: 24,
                tabSize: 4,
                autoIndent: "full",
                minimap: { enabled: false }
              }}
              language={language === "py" ? "python" : language}
              onChange={(value) => setCode(value || "")}
            />
          </div>
          
          <div className="rounded-md border bg-slate-900 text-white p-4">
            <div className="flex items-center mb-4">
              <TerminalIcon className="mr-2" size={20} />
              <h2 className="text-lg font-semibold">Output</h2>
            </div>
            <div className="font-mono text-sm">
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
    </UserProtectedRoute>
  );
}