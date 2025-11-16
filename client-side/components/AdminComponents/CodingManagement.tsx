// components/AdminComponents/CodingManagement.tsx
'use client';

import { CodingTopic } from '@/types/Coding';
import { CodingQuestion } from '@/types/Coding';
import { TestCase } from '@/types/Coding';
import { useState, useEffect } from 'react';
import { 
  fetchCodingTopics, 
  addCodingTopic, 
  updateCodingTopic, 
  deleteCodingTopic,
  fetchCodingQuestionsByTopic,
  addCodingQuestion,
  updateCodingQuestion,
  deleteCodingQuestion,
  fetchTestCasesByQuestion,
  addTestCase,
  updateTestCase,
  deleteTestCase
} from '@/actions/CodingAPI';

interface CodingManagementProps {
  onCodingChange: () => void;
}

const CodingManagement = ({ onCodingChange }: CodingManagementProps) => {
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
    title: '',
    description: '',
    function_signature: '',
    constraints: '',
    difficulty: 'medium',
    topic_id: 0
  });

  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testCasesLoading, setTestCasesLoading] = useState(false);
  const [testCasesError, setTestCasesError] = useState<string | null>(null);
  const [isAddTestCaseModalOpen, setIsAddTestCaseModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [newTestCase, setNewTestCase] = useState({
    input_data: '',
    expected_output: '',
    is_sample: false
  });

  const [operationLoading, setOperationLoading] = useState(false);

  // Fetch topics on component mount
  useEffect(() => {
    fetchTopics();
  }, []);

  // Fetch questions when a topic is selected
  useEffect(() => {
    if (selectedTopic) {
      fetchQuestions();
    }
  }, [selectedTopic]);

  // Fetch test cases when a question is selected
  useEffect(() => {
    if (selectedQuestion) {
      fetchTestCases();
    }
  }, [selectedQuestion]);

  const fetchTopics = async () => {
    setTopicsLoading(true);
    try {
      const data = await fetchCodingTopics();
      setTopics(data);
      setTopicsError(null);
    } catch (err) {
      setTopics([]);
      setTopicsError('Failed to fetch coding topics');
    } finally {
      setTopicsLoading(false);
    }
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
    } finally {
      setQuestionsLoading(false);
    }
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
    } finally {
      setTestCasesLoading(false);
    }
  };

  const handleAddTopic = async () => {
    setOperationLoading(true);
    try {
      const addedTopic = await addCodingTopic(newTopic);
      if (addedTopic) {
        setIsAddTopicModalOpen(false);
        setNewTopic({ name: '', description: '' });
        fetchTopics();
        onCodingChange();
      } else {
        alert('Failed to add coding topic');
      }
    } catch (error) {
      console.error('Error adding coding topic:', error);
      alert('Error adding coding topic');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditTopic = async (topic: CodingTopic) => {
    setOperationLoading(true);
    try {
      const updatedTopic = await updateCodingTopic(topic.id.toString(), {
        name: topic.name,
        description: topic.description
      });

      if (updatedTopic) {
        setEditingTopic(null);
        fetchTopics();
        onCodingChange();
      } else {
        alert('Failed to update coding topic');
      }
    } catch (error) {
      console.error('Error updating coding topic:', error);
      alert('Error updating coding topic');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteTopic = async (id: number) => {
    if (confirm('Are you sure you want to delete this coding topic? All associated questions will also be deleted.')) {
      setOperationLoading(true);
      try {
        const success = await deleteCodingTopic(id.toString());
        if (success) {
          fetchTopics();
          onCodingChange();
        } else {
          alert('Failed to delete coding topic');
        }
      } catch (error) {
        console.error('Error deleting coding topic:', error);
        alert('Error deleting coding topic');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedTopic) return;

    setOperationLoading(true);
    try {
      const questionData = {
        ...newQuestion,
        topic_id: selectedTopic.id
      };

      const addedQuestion = await addCodingQuestion(questionData);
      if (addedQuestion) {
        setIsAddQuestionModalOpen(false);
        setNewQuestion({
          title: '',
          description: '',
          function_signature: '',
          constraints: '',
          difficulty: 'medium',
          topic_id: 0
        });
        fetchQuestions();
      } else {
        alert('Failed to add coding question');
      }
    } catch (error) {
      console.error('Error adding coding question:', error);
      alert('Error adding coding question');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditQuestion = async (question: CodingQuestion) => {
    setOperationLoading(true);
    try {
      const updatedQuestion = await updateCodingQuestion(question.id.toString(), {
        title: question.title,
        description: question.description,
        function_signature: question.function_signature,
        constraints: question.constraints || '',
        difficulty: question.difficulty,
        topic_id: question.topic_id
      });

      if (updatedQuestion) {
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        alert('Failed to update coding question');
      }
    } catch (error) {
      console.error('Error updating coding question:', error);
      alert('Error updating coding question');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (confirm('Are you sure you want to delete this coding question?')) {
      setOperationLoading(true);
      try {
        const success = await deleteCodingQuestion(id.toString());
        if (success) {
          fetchQuestions();
        } else {
          alert('Failed to delete coding question');
        }
      } catch (error) {
        console.error('Error deleting coding question:', error);
        alert('Error deleting coding question');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleAddTestCase = async () => {
    if (!selectedQuestion) return;

    setOperationLoading(true);
    try {
      const addedTestCase = await addTestCase(selectedQuestion.id, newTestCase);
      if (addedTestCase) {
        setIsAddTestCaseModalOpen(false);
        setNewTestCase({
          input_data: '',
          expected_output: '',
          is_sample: false
        });
        fetchTestCases();
      } else {
        alert('Failed to add test case');
      }
    } catch (error) {
      console.error('Error adding test case:', error);
      alert('Error adding test case');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditTestCase = async (testCase: TestCase) => {
    setOperationLoading(true);
    try {
      const updatedTestCase = await updateTestCase(testCase.id.toString(), {
        input_data: testCase.input_data,
        expected_output: testCase.expected_output,
        is_sample: testCase.is_sample
      });

      if (updatedTestCase) {
        setEditingTestCase(null);
        fetchTestCases();
      } else {
        alert('Failed to update test case');
      }
    } catch (error) {
      console.error('Error updating test case:', error);
      alert('Error updating test case');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteTestCase = async (id: number) => {
    if (confirm('Are you sure you want to delete this test case?')) {
      setOperationLoading(true);
      try {
        const success = await deleteTestCase(id.toString());
        if (success) {
          fetchTestCases();
        } else {
          alert('Failed to delete test case');
        }
      } catch (error) {
        console.error('Error deleting test case:', error);
        alert('Error deleting test case');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  // Render test case management
  const renderTestCaseManagement = () => {
    if (!selectedQuestion) return null;

    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              setSelectedQuestion(null);
            }}
            className="text-blue-500 hover:text-blue-700 mr-4"
          >
            &larr; Back to Questions
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">
            Test Cases for: {selectedQuestion.title}
          </h2>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setIsAddTestCaseModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <span className="mr-2">+</span> Add New Test Case
          </button>
        </div>

        {testCasesLoading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white shadow rounded-lg p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : testCasesError ? (
          <p className="text-red-600 text-sm">{testCasesError}</p>
        ) : (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Input
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Output
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testCases.map((testCase) => (
                  <tr key={testCase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{testCase.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {testCase.input_data}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {testCase.expected_output}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {testCase.is_sample ? 'Sample' : 'Hidden'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingTestCase(testCase)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTestCase(testCase.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Test Case Modal */}
        {isAddTestCaseModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Test Case</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Input Data</label>
                  <textarea
                    value={newTestCase.input_data}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input_data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter input data (e.g., [1,2,3])"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                  <textarea
                    value={newTestCase.expected_output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter expected output"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTestCase.is_sample}
                    onChange={(e) => setNewTestCase({ ...newTestCase, is_sample: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    This is a sample test case (visible to users)
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddTestCaseModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTestCase}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Add Test Case
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Test Case Modal */}
        {editingTestCase && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Test Case</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Input Data</label>
                  <textarea
                    value={editingTestCase.input_data}
                    onChange={(e) => setEditingTestCase({ ...editingTestCase, input_data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                  <textarea
                    value={editingTestCase.expected_output}
                    onChange={(e) => setEditingTestCase({ ...editingTestCase, expected_output: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingTestCase.is_sample}
                    onChange={(e) => setEditingTestCase({ ...editingTestCase, is_sample: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    This is a sample test case (visible to users)
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingTestCase(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditTestCase(editingTestCase)}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render question management
  const renderQuestionManagement = () => {
    if (!selectedTopic) return null;

    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              setSelectedTopic(null);
              setSelectedQuestion(null);
            }}
            className="text-blue-500 hover:text-blue-700 mr-4"
          >
            &larr; Back to Topics
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">
            Coding Questions for {selectedTopic.name}
          </h2>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setIsAddQuestionModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <span className="mr-2">+</span> Add New Question
          </button>
        </div>

        {questionsLoading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white shadow rounded-lg p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : questionsError ? (
          <p className="text-red-600 text-sm">{questionsError}</p>
        ) : (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Function Signature
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{question.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {question.function_signature}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingQuestion(question)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedQuestion(question)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Manage Test Cases
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Question Modal */}
        {isAddQuestionModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Coding Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter question title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newQuestion.description}
                    onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter question description"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Function Signature</label>
                  <input
                    type="text"
                    value={newQuestion.function_signature}
                    onChange={(e) => setNewQuestion({ ...newQuestion, function_signature: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g., def two_sum(nums: List[int], target: int) -> List[int]:"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
                  <textarea
                    value={newQuestion.constraints}
                    onChange={(e) => setNewQuestion({ ...newQuestion, constraints: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter constraints (optional)"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddQuestionModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Coding Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingQuestion.title}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingQuestion.description}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Function Signature</label>
                  <input
                    type="text"
                    value={editingQuestion.function_signature}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, function_signature: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
                  <textarea
                    value={editingQuestion.constraints || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, constraints: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditQuestion(editingQuestion)}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Show test case management if a question is selected
  if (selectedQuestion) {
    return renderTestCaseManagement();
  }

  // Show question management if a topic is selected
  if (selectedTopic) {
    return renderQuestionManagement();
  }

  // Show topic management by default
  if (topicsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topicsError) {
    return <p className="text-red-600 text-sm">{topicsError}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Coding Topics Management</h2>
        <button
          onClick={() => setIsAddTopicModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
        >
          <span className="mr-2">+</span> Add New Topic
        </button>
      </div>

      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Questions
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topics.map((topic) => (
              <tr key={topic.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{topic.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{topic.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {topic.description || 'No description'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {topic.question_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setEditingTopic(topic)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="text-red-600 hover:text-red-900 mr-3"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedTopic(topic)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Manage Questions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Topic Modal */}
      {isAddTopicModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Coding Topic</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
                <input
                  type="text"
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter topic name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter topic description"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsAddTopicModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTopic}
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Add Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Topic Modal */}
      {editingTopic && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Coding Topic</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
                <input
                  type="text"
                  value={editingTopic.name}
                  onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingTopic.description || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingTopic(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditTopic(editingTopic)}
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingManagement;