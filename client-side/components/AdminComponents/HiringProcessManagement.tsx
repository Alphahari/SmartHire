'use client';
import { useState, useEffect } from 'react';
import { Quiz } from '@/types/Quiz';
import { CodingQuestion } from '@/types/Coding';
import { fetchAdminMockTests, createMockTest, updateMockTest, deleteMockTest } from '@/actions/MockTestAPI';
import { fetchAllQuizzes } from '@/actions/QuizzesAPI';
import { fetchAllCodingQuestions } from '@/actions/CodingAPI';
import { Plus, Trash2, Edit2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// ... interface MockTest kept same ...
interface MockTest {
  id: number;
  name: string;
  description: string;
  quiz_id: number;
  coding_question_id: number;
  is_active: boolean;
}

export default function HiringProcessManagement() {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [codingQuestions, setCodingQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<number | ''>('');
  const [selectedCodingId, setSelectedCodingId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mockTestsData, quizzesData, codingData] = await Promise.all([
        fetchAdminMockTests(),
        fetchAllQuizzes(),
        fetchAllCodingQuestions()
      ]);
      setMockTests(mockTestsData || []);
      setQuizzes(quizzesData || []);
      setCodingQuestions(codingData?.questions || []);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedQuizId || !selectedCodingId) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setError('');
      const payload = {
        name,
        description,
        quiz_id: Number(selectedQuizId),
        coding_question_id: Number(selectedCodingId),
        is_active: isActive
      };

      if (editingId) {
        await updateMockTest(editingId, payload);
      } else {
        await createMockTest(payload);
      }
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to save mock test');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedQuizId('');
    setSelectedCodingId('');
    setIsActive(true);
    setEditingId(null);
  };

  const handleEdit = (test: MockTest) => {
    setEditingId(test.id);
    setName(test.name);
    setDescription(test.description || '');
    setSelectedQuizId(test.quiz_id);
    setSelectedCodingId(test.coding_question_id);
    setIsActive(test.is_active);
    // Scroll to form (optional UX enhancement)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mock test?')) return;
    try {
      await deleteMockTest(id);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete mock test');
    }
  };

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Hiring Process</h2>
           <p className="text-slate-500 mt-1">Configure mock tests and assessments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? 'Edit Configuration' : 'Create New Test'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4 border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Test Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Senior React Developer Assessment"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Internal notes or description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Quiz *</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(Number(e.target.value))}
                  required
                >
                  <option value="">Select a quiz module...</option>
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>{q.remarks} (ID: {q.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Coding Challenge *</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  value={selectedCodingId}
                  onChange={(e) => setSelectedCodingId(Number(e.target.value))}
                  required
                >
                  <option value="">Select a coding problem...</option>
                  {codingQuestions.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} ({c.difficulty})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">Active (visible to candidates)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {editingId ? 'Save Changes' : 'Create Test'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Existing Assessments</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Components</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockTests.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{m.name}</div>
                        {m.description && <div className="text-xs text-slate-500 mt-1 line-clamp-1">{m.description}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Quiz #{m.quiz_id}</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>Code #{m.coding_question_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {m.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEdit(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {mockTests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-500">
                        No assessments configured yet. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}