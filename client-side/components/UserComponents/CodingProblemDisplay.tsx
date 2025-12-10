// [file name]: CodingProblemDisplay.tsx
// [file content begin]
import { CodingQuestion } from '@/types/Coding';

interface CodingProblemDisplayProps {
  question: CodingQuestion;
}

export default function CodingProblemDisplay({ question }: CodingProblemDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{question.title}</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            question.difficulty === 'easy'
              ? 'bg-green-100 text-green-800'
              : question.difficulty === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </span>
      </div>

      <div className="prose max-w-none mb-6">
        <div className="text-gray-700 whitespace-pre-wrap">{question.description}</div>
      </div>

      {question.constraints && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Constraints</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{question.constraints}</pre>
          </div>
        </div>
      )}

      {/* Removed Function Signature Section */}
      
      {/* Custom Test Cases Format Instructions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Case Format</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-medium text-blue-800 mb-2">For each test case, provide input in the following format:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Input Format:</h4>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`Multiple lines as needed:
first_input_value
second_input_value
...

Example:
5
1 2 3 4 5`}</pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Output Format:</h4>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`Expected output for given input

Example:
15`}</pre>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-blue-200">
              <h4 className="font-medium text-gray-800 mb-1">Tips:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Input should be provided line by line as it would be read by standard input</li>
                <li>For array inputs, provide each element space-separated on a single line</li>
                <li>Ensure exact formatting matches expected input parsing</li>
                <li>Output should be exactly as expected (including whitespace)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {question.test_cases && question.test_cases.filter(tc => tc.is_sample).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Sample Test Cases</h3>
          <div className="space-y-3">
            {question.test_cases
              .filter(tc => tc.is_sample)
              .map((testCase, index) => (
                <div key={testCase.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Input:</h4>
                      <pre className="text-sm bg-gray-50 p-2 rounded text-gray-800 overflow-x-auto">
                        {testCase.input_data}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Expected Output:</h4>
                      <pre className="text-sm bg-gray-50 p-2 rounded text-gray-800 overflow-x-auto">
                        {testCase.expected_output}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
// [file content end]