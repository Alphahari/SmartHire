"use client";
import { useState, useEffect } from "react";
import { submitCode } from "@/actions/codeExecution";
import dynamic from "next/dynamic";
import Button from "@/components/ui/button";
import UserProtectedRoute from "@/components/UserComponents/UserProtectedRoute";
import { Loader2, ChevronUp, ChevronDown, CheckCircle, XCircle } from "lucide-react";

// Dynamically import Monaco Editor
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function CodeEditorPage() {

  useEffect(() => {

    // 🔒 Prevent Right-Click
    const disableContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);

    // 🔒 Prevent Copy, Paste, Cut
    const disableClipboard = (e: Event) => e.preventDefault();
    document.addEventListener("copy", disableClipboard);
    document.addEventListener("paste", disableClipboard);
    document.addEventListener("cut", disableClipboard);

    // 🔒 Prevent Text Selection
    const disableSelect = (e: Event) => e.preventDefault();
    document.addEventListener("selectstart", disableSelect);

    // 🔒 Prevent Dragging of Anything (text, files, elements)
    const disableDrag = (e: Event) => e.preventDefault();
    document.addEventListener("dragstart", disableDrag);

    // 🔒 Prevent Print (Ctrl+P)
    const disablePrintShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        alert("Printing is disabled.");
      }
    };
    document.addEventListener("keydown", disablePrintShortcut);

    // 🔒 Prevent Screenshots (best effort)
    const preventPrintScreen = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");  // wipes screenshot from clipboard
        alert("Screenshots are disabled.");
      }
    };
    document.addEventListener("keydown", preventPrintScreen);

    // 🔒 Block All Dangerous Keyboard Shortcuts
    const disableShortcuts = (e: KeyboardEvent) => {

      // Restricted keys
      const blockedKeys = [
        "c", "v", "x", "s", "u", "p", "a",
      ];

      // Block Ctrl + Key
      if (e.ctrlKey && blockedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && ["i", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Block F12
      if (e.key === "F12") {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", disableShortcuts);

    // 🔒 Detect DevTools Open (Best Possible)
    const checkDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        document.body.innerHTML =
          "<div style='font-size:40px; text-align:center; margin-top:20vh;'>DevTools is disabled</div>";
      }
    };
    const interval = setInterval(checkDevTools, 1000);

    // 🔥 Cleanup on unmount
    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("copy", disableClipboard);
      document.removeEventListener("paste", disableClipboard);
      document.removeEventListener("cut", disableClipboard);
      document.removeEventListener("selectstart", disableSelect);
      document.removeEventListener("dragstart", disableDrag);
      document.removeEventListener("keydown", disablePrintShortcut);
      document.removeEventListener("keydown", preventPrintScreen);
      document.removeEventListener("keydown", disableShortcuts);
      clearInterval(interval);
    };

  }, []);




  const boilerPlate = {
    java: "public class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println(\"Hello, Java!\");\n\t}\n}",
    c: "#include <stdio.h>\n\nint main() {\n\tprintf(\"Hello, C!\\n\");\n\treturn 0;\n}",
    py: "def main():\n\tprint(\"Hello, Python!\")\n\nif __name__ == '__main__':\n\tmain()",
    cpp: "#include <iostream>\n\nusing namespace std;\n\nint main() {\n\tcout << \"Hello, C++!\" << endl;\n\treturn 0;\n}",
  };

  const [result, setResult] = useState<any[]>([]);
  const [language, setLanguage] = useState<"py" | "java" | "cpp" | "c">("py");
  const [codeExecuting, setCodeExecuting] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [code, setCode] = useState<string>(boilerPlate[language]);
  const [selectedTestCase, setSelectedTestCase] = useState<number | null>(null);

  // ⭐ NEW — Store last-written code for each language
  const [codeStore, setCodeStore] = useState({
    py: boilerPlate.py,
    java: boilerPlate.java,
    cpp: boilerPlate.cpp,
    c: boilerPlate.c,
  });

  // Test Cases
  const [testCases, setTestCases] = useState<
    { input: string; expected_output: string }[]
  >([{ input: "2 3", expected_output: "5" }]);

  const addTestCase = () =>
    setTestCases([...testCases, { input: "", expected_output: "" }]);

  const removeTestCase = (index: number) =>
    setTestCases(testCases.filter((_, i) => i !== index));

  const updateTestCase = (
    index: number,
    field: "input" | "expected_output",
    value: string
  ) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  // ⭐ FIXED — Preserve last-written code when switching languages
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as "py" | "java" | "cpp" | "c";

    // 1. Save current code into store
    setCodeStore((prev) => ({
      ...prev,
      [language]: code,
    }));

    // 2. Switch to new language
    setLanguage(newLang);

    // 3. Load last saved code OR boilerplate
    setCode(codeStore[newLang]);
  };

  // Run Code
  const handleRunCode = async () => {
    setResult([]);
    setCodeExecuting(true);

    const formattedTestCases = testCases.map((tc) => ({
      input: tc.input.replace(/ /g, "\n"),
      expected_output: tc.expected_output,
    }));

    try {
      const rawResult = await submitCode({
        lang: language,
        code,
        test_cases: formattedTestCases,
      });

      setResult(JSON.parse(rawResult));
    } catch (error) {
      setResult([
        { error: error instanceof Error ? error.message : "Unknown error" },
      ]);
    } finally {
      setCodeExecuting(false);
      setIsResultsOpen(true);
    }
  };

  const toggleResults = () => setIsResultsOpen((prev) => !prev);

  const handleTestCaseClick = (index: number) => {
    setSelectedTestCase(index === selectedTestCase ? null : index);
  };

  return (
    <div className="min-h-screen flex bg-[#1a1a1a] text-gray-200 overflow-hidden">
      {/* LEFT: Problem Description */}
      <div className="flex-1 p-4 border-r border-gray-700 overflow-y-auto max-h-screen">
        <h1 className="text-3xl font-bold text-white">Two Sum</h1>

        <p className="mt-4 text-gray-300">
          Given an array of integers `nums` and an integer `target`, return indices
          of the two numbers such that they add up to target. <br />
          You may assume that each input would have exactly one solution, and
          you may not use the same element twice. <br />
          You can return the answer in any order.
        </p>

        <h2 className="mt-6 text-xl font-semibold text-white">Input Test Case Format</h2>
        <pre className="mt-2 p-4 bg-[#2a2a2a] text-gray-200 rounded-md border border-gray-700">
          The input provided will be as follows:
          <br />
          1. The first number is `n` (the number of elements in the array).
          <br />
          2. The next `n` numbers are the elements of the array `nums`.
          <br />
          3. The last number is the integer `target`.
          <br /><br />
          Example:
          <br />
          Input: 4 3 7 1 5 8
          <br />
          This means the array is nums = [3, 7, 1, 5] and the target = 8.
        </pre>

        <h2 className="mt-6 text-xl font-semibold text-white">Expected Output Format</h2>
        <pre
          className="mt-2 p-4 bg-[#2a2a2a] text-gray-200 rounded-md border border-gray-700 break-words whitespace-pre-wrap"
        >
          The output should be a list of two integers representing the indices of the two numbers
          in the array that add up to the `target`.
          <br />
          Example:
          <br />
          Output: [1, 3]
          <br />
          The answer is 1 and 3, because nums[1] + nums[3] = 7 + 5 = 8.
        </pre>

        <h2 className="mt-6 text-xl font-semibold text-white">Example Test Cases</h2>

        <pre className="mt-2 p-4 bg-[#2a2a2a] text-gray-200 rounded-md border border-gray-700">
          Input: 3 1 2 3 4
          <br />
          Output: [0, 2]
        </pre>

        <pre className="mt-2 p-4 bg-[#2a2a2a] text-gray-200 rounded-md border border-gray-700">
          Input: 4 3 7 1 5 8
          <br />
          Output: [1, 3]
        </pre>

        <h2 className="mt-6 text-xl font-semibold text-white">Constraints</h2>
        <pre className="mt-2 p-4 bg-[#2a2a2a] text-gray-200 rounded-md border border-gray-700">
          1. 2 ≤ nums.length ≤ 10^4
          <br />
          2. -10^9 ≤ nums[i] ≤ 10^9
          <br />
          3. -10^9 ≤ target ≤ 10^9
          <br />
          4. There is exactly one solution.
        </pre>
      </div>


      <UserProtectedRoute>
        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col h-screen p-3 overflow-hidden bg-[#1a1a1a]">

          {/* TOP BAR */}
          <div className="mb-4 flex justify-between items-center">
            <select
              className="px-4 py-2 bg-[#2b2b2b] border border-gray-700 text-gray-200 rounded-md"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="py">Python</option>
            </select>

            <button
              onClick={() => alert("Saved!")}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Save and Proceed
            </button>
          </div>

          {/* CODE EDITOR */}
          <div className="flex-1 mb-4 p-2 rounded-md overflow-hidden rounded-lg border border-gray-700">
            <Editor
              language={language === "py" ? "python" : language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 15,
              }}
            />
          </div>

          {/* TEST CASES */}
          <div className="mb-4 bg-[#2a2a2a] p-3 rounded-md border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-white">Custom Test Cases</h2>
              <button
                onClick={addTestCase}
                className="bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700"
              >
                + Add
              </button>
            </div>

            {testCases.map((tc, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-1 mb-2">
                <input
                  type="text"
                  placeholder="Input"
                  value={tc.input}
                  onChange={(e) => updateTestCase(index, "input", e.target.value)}
                  className="flex-1 sm:w-1/3 md:w-1/4 bg-[#1f1f1f] border border-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  placeholder="Expected Output"
                  value={tc.expected_output}
                  onChange={(e) =>
                    updateTestCase(index, "expected_output", e.target.value)
                  }
                  className="flex-1 sm:w-1/3 md:w-1/4 bg-[#1f1f1f] border border-gray-700 text-gray-200 rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => removeTestCase(index)}
                  className="bg-red-600 text-white px-2 rounded hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* RESULTS BOX */}
          <div
            className={`flex flex-row flex-1 overflow-hidden transition-all duration-500 ${isResultsOpen ? "max-h-screen" : "max-h-0"
              }`}
          >
            <div className="flex flex-col w-1/3 p-2 gap-2 overflow-y-auto bg-[#1f1f1f] border border-gray-700 rounded-md">
              {result.map((r: any, index: number) => (
                <button
                  key={index}
                  className={`p-2 rounded-md text-white flex items-center justify-between border ${r.status === "PASSED" ? "border-green-500" : "border-red-500"}`}
                  onClick={() => handleTestCaseClick(index)}
                >
                  <span>Test Case {index + 1}</span>

                  {r.status === "PASSED" ? (
                    <CheckCircle className="text-green-500 ml-2" />
                  ) : (
                    <XCircle className="text-red-500 ml-2" />
                  )}
                </button>
              ))}
            </div>

            {/* RIGHT RESULTS PANEL */}
            <div className="flex-1 p-2 bg-[#111] text-gray-200 rounded-md overflow-y-auto border border-gray-700 ml-2">
              {selectedTestCase !== null &&
                selectedTestCase < result.length ? (
                <>
                  <div
                    className={`font-semibold ${result[selectedTestCase].status === "PASSED"
                      ? "text-green-500"
                      : "text-red-500"
                      }`}
                  >
                    Status: {result[selectedTestCase].status}
                  </div>
                  <div className="font-bold text-orange-400">Input:</div>
                  <pre className="whitespace-pre-wrap">{result[selectedTestCase].input}</pre>

                  <div className="font-bold text-orange-400 mt-2">Expected Output:</div>
                  <pre className="whitespace-pre-wrap">{result[selectedTestCase].expected}</pre>

                  <div className="font-bold mt-2 text-orange-400">Your Output:</div>
                  <pre className="whitespace-pre-wrap">
                    {result[selectedTestCase].output || (
                      <em className="text-red-300">No Output</em>
                    )}
                  </pre>


                </>
              ) : (
                <div className="text-gray-400">Select a test case to view results</div>
              )}
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-between items-center mt-3">
            <Button
              onClick={toggleResults}
              className="flex items-center text-gray-300 hover:text-white"
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
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
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
