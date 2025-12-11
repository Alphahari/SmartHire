import { CodingQuestion } from '@/types/Coding';
import { FileText, ListChecks } from 'lucide-react';

interface CodingProblemDisplayProps {
  question: CodingQuestion;
}

export default function CodingProblemDisplay({ question }: CodingProblemDisplayProps) {
  return (
    <div className="p-6 pb-20">
      {/* Title & Metadata */}
      <div className="border-b border-slate-100 pb-4 mb-6">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">{question.title}</h2>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize border ${
              question.difficulty === 'easy'
                ? 'bg-green-50 text-green-700 border-green-200'
                : question.difficulty === 'medium'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {question.difficulty}
          </span>
          <span className="text-xs text-slate-400">ID: #{question.id}</span>
        </div>
      </div>

      {/* Description */}
      <div className="prose prose-sm prose-slate max-w-none mb-8">
        <div className="whitespace-pre-wrap leading-relaxed">{question.description}</div>
      </div>

      {/* Examples */}
      {question.test_cases && question.test_cases.filter(tc => tc.is_sample).length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-slate-500" />
            Examples
          </h3>
          <div className="space-y-4">
            {question.test_cases
              .filter(tc => tc.is_sample)
              .map((testCase, index) => (
                <div key={testCase.id} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-medium text-slate-600">
                    Example {index + 1}
                  </div>
                  <div className="p-3 grid gap-2 text-sm">
                    <div>
                      <span className="font-semibold text-slate-700">Input:</span> 
                      <code className="ml-2 font-mono text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">{testCase.input_data.replace(/\n/g, ' ')}</code>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Output:</span>
                      <code className="ml-2 font-mono text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">{testCase.expected_output}</code>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Constraints */}
      {question.constraints && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
            <ListChecks className="w-4 h-4 mr-2 text-slate-500" />
            Constraints
          </h3>
          <ul className="list-disc list-inside text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
             {question.constraints.split('\n').map((c, i) => (
               <li key={i}>{c}</li>
             ))}
          </ul>
        </div>
      )}
    </div>
  );
}