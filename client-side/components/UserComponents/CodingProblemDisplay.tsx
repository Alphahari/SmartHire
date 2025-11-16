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

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Function Signature</h3>
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
          {question.function_signature}
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