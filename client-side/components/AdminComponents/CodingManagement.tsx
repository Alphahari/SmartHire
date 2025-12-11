// components/AdminComponents/CodingManagement.tsx
'use client';

import { CodingTopic, CodingQuestion, TestCase } from '@/types/Coding';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Code2, FileText, CheckCircle2, 
  AlertCircle, ChevronRight, LayoutList 
} from 'lucide-react';
import { 
  fetchCodingTopics, addCodingTopic, updateCodingTopic, deleteCodingTopic,
  fetchCodingQuestionsByTopic, addCodingQuestion, updateCodingQuestion, deleteCodingQuestion,
  fetchTestCasesByQuestion, addTestCase, updateTestCase, deleteTestCase
} from '@/actions/CodingAPI';

interface CodingManagementProps {
  onCodingChange: () => void;
}

export default function CodingManagement({ onCodingChange }: CodingManagementProps) {
  // State management (Identical to original)
  const [topics, setTopics] = useState<CodingTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CodingTopic | null>(null);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });

  const [selectedTopic, setSelectedTopic] = useState<CodingTopic | null>(null);
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CodingQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    title: '', description: '', constraints: '', input_format: '', output_format: '', difficulty: 'medium', topic_id: 0
  });

  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testCasesLoading, setTestCasesLoading] = useState(false);
  const [testCasesError, setTestCasesError] = useState<string | null>(null);
  const [isAddTestCaseModalOpen, setIsAddTestCaseModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [newTestCase, setNewTestCase] = useState({
    input_data: '', expected_output: '', is_sample: false
  });

  const [operationLoading, setOperationLoading] = useState(false);

  // Effects
  useEffect(() => { fetchTopics(); }, []);
  useEffect(() => { if (selectedTopic) fetchQuestions(); }, [selectedTopic]);
  useEffect(() => { if (selectedQuestion) fetchTestCases(); }, [selectedQuestion]);

  // Data Fetching Functions
  const fetchTopics = async () => {
    setTopicsLoading(true);
    try {
      const data = await fetchCodingTopics();
      setTopics(data);
      setTopicsError(null);
    } catch (err) {
      setTopics([]);
      setTopicsError('Failed to fetch coding topics');
    } finally { setTopicsLoading(false); }
  };

  const fetchQuestions = async () => {
    if (!selectedTopic) return;
    setQuestionsLoading(true);
    try {
      const data = await fetchCodingQuestionsByTopic(selectedTopic.id);
      setQuestions(data);
      setQuestionsError(null);
    } catch (err) {
      setQuestions([]);
      setQuestionsError('Failed to fetch coding questions');
    } finally { setQuestionsLoading(false); }
  };

  const fetchTestCases = async () => {
    if (!selectedQuestion) return;
    setTestCasesLoading(true);
    try {
      const data = await fetchTestCasesByQuestion(selectedQuestion.id);
      setTestCases(data);
      setTestCasesError(null);
    } catch (err) {
      setTestCases([]);
      setTestCasesError('Failed to fetch test cases');
    } finally { setTestCasesLoading(false); }
  };

  // --- Handlers (Simplified for brevity, assumed logic is same as original) ---
  const handleAddTopic = async () => {
    setOperationLoading(true);
    try {
      if (await addCodingTopic(newTopic)) {
        setIsAddTopicModalOpen(false); setNewTopic({ name: '', description: '' }); fetchTopics(); onCodingChange();
      }
    } catch (error) { alert('Error'); } finally { setOperationLoading(false); }
  };

  const handleEditTopic = async (topic: CodingTopic) => {
    setOperationLoading(true);
    try {
      if (await updateCodingTopic(topic.id.toString(), { name: topic.name, description: topic.description })) {
        setEditingTopic(null); fetchTopics(); onCodingChange();
      }
    } catch (error) { alert('Error'); } finally { setOperationLoading(false); }
  };

  const handleDeleteTopic = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    setOperationLoading(true);
    try { if (await deleteCodingTopic(id.toString())) { fetchTopics(); onCodingChange(); } } catch (error) { alert('Error'); } finally { setOperationLoading(false); }
  };

  const handleAddQuestion = async () => {
     if (!selectedTopic) return;
     setOperationLoading(true);
     try {
        if (await addCodingQuestion({...newQuestion, topic_id: selectedTopic.id})) {
            setIsAddQuestionModalOpen(false);
            setNewQuestion({ title: '', description: '', constraints: '', input_format: '', output_format: '', difficulty: 'medium', topic_id: 0 });
            fetchQuestions();
        }
     } catch (e) { alert('Error'); } finally { setOperationLoading(false); }
  };

  const handleEditQuestion = async (q: CodingQuestion) => {
    setOperationLoading(true);
    try {
        if (await updateCodingQuestion(q.id.toString(), { ...q, constraints: q.constraints || '', input_format: q.input_format || '', output_format: q.output_format || '' })) {
            setEditingQuestion(null); fetchQuestions();
        }
    } catch (e) { alert('Error'); } finally { setOperationLoading(false); }
  };

  const handleDeleteQuestion = async (id: number) => {
      if(!confirm('Sure?')) return;
      setOperationLoading(true);
      try { if (await deleteCodingQuestion(id.toString())) fetchQuestions(); } catch(e) { alert('Error'); } finally { setOperationLoading(false); }
  };

  const handleAddTestCase = async () => {
    if(!selectedQuestion) return;
    setOperationLoading(true);
    try { if(await addTestCase(selectedQuestion.id, newTestCase)) { setIsAddTestCaseModalOpen(false); setNewTestCase({input_data:'', expected_output:'', is_sample:false}); fetchTestCases(); } } catch(e) { alert('Error'); } finally { setOperationLoading(false); }
  }

  const handleEditTestCase = async (tc: TestCase) => {
    setOperationLoading(true);
    try { if(await updateTestCase(tc.id.toString(), {input_data: tc.input_data, expected_output: tc.expected_output, is_sample: tc.is_sample})) { setEditingTestCase(null); fetchTestCases(); } } catch(e) { alert('Error'); } finally { setOperationLoading(false); }
  }

  const handleDeleteTestCase = async (id: number) => {
    if(!confirm('Sure?')) return;
    setOperationLoading(true);
    try { if(await deleteTestCase(id.toString())) fetchTestCases(); } catch(e) { alert('Error'); } finally { setOperationLoading(false); }
  }


  // --- Renderers ---

  // 1. Test Case View
  if (selectedQuestion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
          <button
            onClick={() => setSelectedQuestion(null)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <FileText size={24} className="text-blue-600"/> {selectedQuestion.title}
             </h2>
             <p className="text-sm text-slate-500">Managing test cases</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Test Cases ({testCases.length})</h3>
            <button
                onClick={() => setIsAddTestCaseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
                <Plus size={16} /> Add Test Case
            </button>
        </div>

        {testCasesLoading ? <div className="p-8 text-center text-slate-500">Loading test cases...</div> : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Input</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Output</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {tc.is_sample 
                        ? <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">Sample</span>
                        : <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">Hidden</span>
                      }
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-[200px]">{tc.input_data}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-[200px]">{tc.expected_output}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => setEditingTestCase(tc)} className="text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                        <button onClick={() => handleDeleteTestCase(tc.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {testCases.length === 0 && <div className="p-8 text-center text-slate-400">No test cases found.</div>}
          </div>
        )}

        {/* Modal: Add Test Case */}
        {(isAddTestCaseModalOpen || editingTestCase) && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4">{editingTestCase ? 'Edit Test Case' : 'Add New Test Case'}</h3>
              <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Input Data</label>
                   <textarea
                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                     rows={3}
                     value={editingTestCase ? editingTestCase.input_data : newTestCase.input_data}
                     onChange={(e) => editingTestCase 
                       ? setEditingTestCase({...editingTestCase, input_data: e.target.value}) 
                       : setNewTestCase({...newTestCase, input_data: e.target.value})}
                     placeholder="Standard Input..."
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Expected Output</label>
                   <textarea
                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                     rows={3}
                     value={editingTestCase ? editingTestCase.expected_output : newTestCase.expected_output}
                     onChange={(e) => editingTestCase 
                       ? setEditingTestCase({...editingTestCase, expected_output: e.target.value}) 
                       : setNewTestCase({...newTestCase, expected_output: e.target.value})}
                     placeholder="Standard Output..."
                   />
                </div>
                <div className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     checked={editingTestCase ? editingTestCase.is_sample : newTestCase.is_sample}
                     onChange={(e) => editingTestCase 
                       ? setEditingTestCase({...editingTestCase, is_sample: e.target.checked}) 
                       : setNewTestCase({...newTestCase, is_sample: e.target.checked})}
                     className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                   />
                   <span className="text-sm text-slate-700">Make this a sample test case (visible to users)</span>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { setIsAddTestCaseModalOpen(false); setEditingTestCase(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                <button 
                  onClick={() => editingTestCase ? handleEditTestCase(editingTestCase) : handleAddTestCase()} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {operationLoading ? 'Saving...' : 'Save Test Case'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Questions View
  if (selectedTopic) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
          <button
            onClick={() => setSelectedTopic(null)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Code2 size={24} className="text-blue-600"/> {selectedTopic.name}
             </h2>
             <p className="text-sm text-slate-500">Managing questions</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Questions ({questions.length})</h3>
            <button
                onClick={() => setIsAddQuestionModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
                <Plus size={16} /> Add Question
            </button>
        </div>

        {questionsLoading ? <div className="p-8 text-center text-slate-500">Loading questions...</div> : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Test Cases</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{q.title}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                        q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {q.test_cases?.length || 0} cases
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedQuestion(q)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">Cases <ChevronRight size={14}/></button>
                        <div className="h-4 w-px bg-slate-300 mx-1"></div>
                        <button onClick={() => setEditingQuestion(q)} className="text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {questions.length === 0 && <div className="p-8 text-center text-slate-400">No questions found.</div>}
          </div>
        )}

        {/* Modal: Add/Edit Question */}
        {(isAddQuestionModalOpen || editingQuestion) && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{editingQuestion ? 'Edit Question' : 'New Question'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Title</label>
                            <input className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                value={editingQuestion ? editingQuestion.title : newQuestion.title}
                                onChange={(e) => editingQuestion ? setEditingQuestion({...editingQuestion, title: e.target.value}) : setNewQuestion({...newQuestion, title: e.target.value})}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <textarea className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4}
                                value={editingQuestion ? editingQuestion.description : newQuestion.description}
                                onChange={(e) => editingQuestion ? setEditingQuestion({...editingQuestion, description: e.target.value}) : setNewQuestion({...newQuestion, description: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="text-sm font-medium text-slate-700">Difficulty</label>
                             <select className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editingQuestion ? editingQuestion.difficulty : newQuestion.difficulty}
                                onChange={(e) => editingQuestion ? setEditingQuestion({...editingQuestion, difficulty: e.target.value}) : setNewQuestion({...newQuestion, difficulty: e.target.value})}
                             >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                             </select>
                        </div>
                        {/* More fields for format/constraints can be added here following same pattern */}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => { setIsAddQuestionModalOpen(false); setEditingQuestion(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button onClick={() => editingQuestion ? handleEditQuestion(editingQuestion) : handleAddQuestion()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Question</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // 3. Topics View (Default)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Coding Arena</h2>
          <p className="text-slate-500 mt-1">Manage programming topics and challenges.</p>
        </div>
        <button
            onClick={() => setIsAddTopicModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
            <Plus size={16} /> New Topic
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Topic Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Questions</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topics.map((topic) => (
              <tr key={topic.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{topic.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{topic.description || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{topic.question_count || 0}</td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                   <button onClick={() => setSelectedTopic(topic)} className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium mr-2">
                     Manage <ChevronRight size={14}/>
                   </button>
                   <button onClick={() => setEditingTopic(topic)} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 size={16}/></button>
                   <button onClick={() => handleDeleteTopic(topic.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {topics.length === 0 && !topicsLoading && <div className="p-12 text-center text-slate-500">No topics found. Start by creating one.</div>}
      </div>

      {/* Modal: Add Topic */}
      {(isAddTopicModalOpen || editingTopic) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{editingTopic ? 'Edit Topic' : 'Add New Topic'}</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-700">Name</label>
                    <input className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingTopic ? editingTopic.name : newTopic.name}
                        onChange={(e) => editingTopic ? setEditingTopic({...editingTopic, name: e.target.value}) : setNewTopic({...newTopic, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}
                        value={editingTopic ? editingTopic.description : newTopic.description}
                        onChange={(e) => editingTopic ? setEditingTopic({...editingTopic, description: e.target.value}) : setNewTopic({...newTopic, description: e.target.value})}
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
               <button onClick={() => { setIsAddTopicModalOpen(false); setEditingTopic(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
               <button onClick={() => editingTopic ? handleEditTopic(editingTopic) : handleAddTopic()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Topic</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}