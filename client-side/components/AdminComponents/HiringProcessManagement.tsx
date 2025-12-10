'use client';
import { useState, useEffect } from 'react';

import { Quiz } from '@/types/Quiz';
import { CodingQuestion } from '@/types/Coding';
import {
  fetchAdminMockTests,
  createMockTest,
  updateMockTest,
  deleteMockTest
} from '@/actions/MockTestAPI';

import { fetchAllQuizzes } from '@/actions/QuizzesAPI';
import { fetchAllCodingQuestions } from '@/actions/CodingAPI';

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

  /** Load all admin mock tests + quizzes + coding questions */
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

  /** Create or update mock test */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !selectedQuizId || !selectedCodingId) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setError('');

      if (editingId) {
        // Update existing
        await updateMockTest(editingId, {
          name,
          description,
          quiz_id: Number(selectedQuizId),
          coding_question_id: Number(selectedCodingId),
          is_active: isActive
        });
      } else {
        // Create new
        await createMockTest({
          name,
          description,
          quiz_id: Number(selectedQuizId),
          coding_question_id: Number(selectedCodingId),
          is_active: isActive
        });
      }

      resetForm();
      loadData();

    } catch (err) {
      console.error(err);
      setError('Failed to save mock test');
    }
  };

  /** Reset form */
  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedQuizId('');
    setSelectedCodingId('');
    setIsActive(true);
    setEditingId(null);
  };

  /** Populate form for edit */
  const handleEdit = (test: MockTest) => {
    setEditingId(test.id);
    setName(test.name);
    setDescription(test.description || '');
    setSelectedQuizId(test.quiz_id);
    setSelectedCodingId(test.coding_question_id);
    setIsActive(test.is_active);
  };

  /** Delete mock test */
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

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">

      {/* Create / Edit Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Edit Mock Test' : 'Create New Mock Test'}
        </h2>

        {error && <div className="p-3 bg-red-50 text-red-700 mb-4 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">Test Name *</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Developer Hiring Test"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border p-2 rounded"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this test..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium mb-2">
                Select Quiz *
              </label>
              <select
                className="w-full border p-2 rounded"
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(Number(e.target.value))}
                required
              >
                <option value="">Select a quiz...</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.remarks} (ID {q.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Select Coding Question *
              </label>
              <select
                className="w-full border p-2 rounded"
                value={selectedCodingId}
                onChange={(e) => setSelectedCodingId(Number(e.target.value))}
                required
              >
                <option value="">Select a coding question...</option>
                {codingQuestions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.difficulty})
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Active (visible to users)</span>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingId ? 'Update Mock Test' : 'Create Mock Test'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Table of mock tests */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">

        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Existing Mock Tests</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Quiz</th>
                <th className="px-6 py-3 text-left">Coding</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {mockTests.map((m) => (
                <tr key={m.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{m.name}</div>
                    {m.description && (
                      <div className="text-sm text-gray-500">{m.description}</div>
                    )}
                  </td>

                  <td className="px-6 py-4">Quiz #{m.quiz_id}</td>
                  <td className="px-6 py-4">Question #{m.coding_question_id}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-6 py-4 space-x-3">
                    <button
                      onClick={() => handleEdit(m)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {mockTests.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No mock tests created yet.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
}
