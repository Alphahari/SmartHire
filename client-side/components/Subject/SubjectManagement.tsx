'use client';

import { Subject } from '@/types/Subject';
import { Chapter } from '@/types/Chapter';
import { Quiz } from '@/types/Quiz';
import { useState, useEffect } from 'react';
import { addSubject, updateSubject, deleteSubject } from '@/actions/SubjectsAPI';
import { fetchChaptersBySubject, addChapter, updateChapter, deleteChapter } from '@/actions/ChaptersAPI';
import { fetchQuizzesByChapter, addQuiz, updateQuiz, deleteQuiz } from '@/actions/QuizzesAPI';
import { Question } from '@/types/Question';
import { fetchQuestionsByQuiz, addQuestion, updateQuestion, deleteQuestion } from '@/actions/QuestionsAPI';

interface SubjectManagementProps {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  onSubjectChange: () => void;
}

const SubjectManagement = ({ subjects, loading, error, onSubjectChange }: SubjectManagementProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [operationLoading, setOperationLoading] = useState(false);

  // State for chapter management
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [newChapter, setNewChapter] = useState({ name: '', description: '', subject_id: 0 });

  // State for quiz management
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);
  const [isAddQuizModalOpen, setIsAddQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [newQuiz, setNewQuiz] = useState({
    chapter_id: 0,
    start_time: '',
    end_time: '',
    duration: 30,
    remarks: ''
  });

  // State for question management
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    quiz_id: 0,
    question_statement: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: 1,
  });

  // Fetch chapters when a subject is selected
  useEffect(() => {
    if (selectedSubject) {
      fetchChapters();
    }
  }, [selectedSubject]);

  // Fetch quizzes when a chapter is selected
  useEffect(() => {
    if (selectedChapter) {
      fetchQuizzes();
    }
  }, [selectedChapter]);

  // Fetch questions when a quiz is selected
  useEffect(() => {
    if (selectedQuiz) {
      fetchQuestions();
    }
  }, [selectedQuiz]);

  const fetchChapters = async () => {
    if (!selectedSubject) return;

    setChaptersLoading(true);
    try {
      const data = await fetchChaptersBySubject(selectedSubject.id);
      if (data && Array.isArray(data)) {
        setChapters(data);
        setChaptersError(null);
      } else {
        setChapters([]);
        setChaptersError('Failed to fetch chapters');
      }
    } catch (err) {
      setChapters([]);
      setChaptersError('An unexpected error occurred');
    } finally {
      setChaptersLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    if (!selectedChapter) return;

    setQuizzesLoading(true);
    try {
      const data = await fetchQuizzesByChapter(selectedChapter.id);
      if (data && Array.isArray(data)) {
        setQuizzes(data);
        setQuizzesError(null);
      } else {
        setQuizzes([]);
        setQuizzesError('Failed to fetch quizzes');
      }
    } catch (err) {
      setQuizzes([]);
      setQuizzesError('An unexpected error occurred');
    } finally {
      setQuizzesLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedQuiz) return;

    setQuestionsLoading(true);
    try {
      const data = await fetchQuestionsByQuiz(selectedQuiz.id);
      if (data && Array.isArray(data)) {
        setQuestions(data);
        setQuestionsError(null);
      } else {
        setQuestions([]);
        setQuestionsError('Failed to fetch questions');
      }
    } catch (err) {
      setQuestions([]);
      setQuestionsError('An unexpected error occurred');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleAddSubject = async () => {
    setOperationLoading(true);
    try {
      const addedSubject = await addSubject(newSubject);
      if (addedSubject) {
        setIsAddModalOpen(false);
        setNewSubject({ name: '', description: '' });
        onSubjectChange();
      } else {
        alert('Failed to add subject');
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      alert('Error adding subject');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditSubject = async (subject: Subject) => {
    setOperationLoading(true);
    try {
      const updatedSubject = await updateSubject(subject.id.toString(), {
        name: subject.name,
        description: subject.description
      });

      if (updatedSubject) {
        setEditingSubject(null);
        onSubjectChange();
      } else {
        alert('Failed to update subject');
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      alert('Error updating subject');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      setOperationLoading(true);
      try {
        const success = await deleteSubject(id.toString());
        if (success) {
          onSubjectChange();
        } else {
          alert('Failed to delete subject');
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Error deleting subject');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleAddChapter = async () => {
    if (!selectedSubject) return;

    setOperationLoading(true);
    try {
      const chapterData = {
        ...newChapter,
        subject_id: selectedSubject.id
      };

      const addedChapter = await addChapter(chapterData);
      if (addedChapter) {
        setIsAddChapterModalOpen(false);
        setNewChapter({ name: '', description: '', subject_id: 0 });
        fetchChapters();
      } else {
        alert('Failed to add chapter');
      }
    } catch (error) {
      console.error('Error adding chapter:', error);
      alert('Error adding chapter');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditChapter = async (chapter: Chapter) => {
    setOperationLoading(true);
    try {
      const updatedChapter = await updateChapter(chapter.id.toString(), {
        name: chapter.name,
        description: chapter.description
      });

      if (updatedChapter) {
        setEditingChapter(null);
        fetchChapters();
      } else {
        alert('Failed to update chapter');
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      alert('Error updating chapter');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteChapter = async (id: number) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      setOperationLoading(true);
      try {
        const success = await deleteChapter(id.toString());
        if (success) {
          fetchChapters();
        } else {
          alert('Failed to delete chapter');
        }
      } catch (error) {
        console.error('Error deleting chapter:', error);
        alert('Error deleting chapter');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleAddQuiz = async () => {
    if (!selectedChapter) return;

    setOperationLoading(true);
    try {
      const quizData = {
        ...newQuiz,
        chapter_id: selectedChapter.id
      };

      const addedQuiz = await addQuiz(quizData);
      if (addedQuiz) {
        setIsAddQuizModalOpen(false);
        setNewQuiz({
          chapter_id: 0,
          start_time: '',
          end_time: '',
          duration: 30,
          remarks: ''
        });
        fetchQuizzes();
      } else {
        alert('Failed to add quiz');
      }
    } catch (error) {
      console.error('Error adding quiz:', error);
      alert('Error adding quiz');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    setOperationLoading(true);
    try {
      const updatedQuiz = await updateQuiz(quiz.id.toString(), {
        start_time: quiz.start_time,
        end_time: quiz.end_time,
        duration: quiz.duration,
        remarks: quiz.remarks
      });

      if (updatedQuiz) {
        setEditingQuiz(null);
        fetchQuizzes();
      } else {
        alert('Failed to update quiz');
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Error updating quiz');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      setOperationLoading(true);
      try {
        const success = await deleteQuiz(id.toString());
        if (success) {
          fetchQuizzes();
        } else {
          alert('Failed to delete quiz');
        }
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Error deleting quiz');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedQuiz) return;

    setOperationLoading(true);
    try {
      const questionData = {
        ...newQuestion,
        quiz_id: selectedQuiz.id
      };

      const addedQuestion = await addQuestion(questionData);
      if (addedQuestion) {
        setIsAddQuestionModalOpen(false);
        setNewQuestion({
          quiz_id: 0,
          question_statement: '',
          option1: '',
          option2: '',
          option3: '',
          option4: '',
          correct_option: 1,
        });
        fetchQuestions();
      } else {
        alert('Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Error adding question');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditQuestion = async (question: Question) => {
    setOperationLoading(true);
    try {
      const updatedQuestion = await updateQuestion(question.id.toString(), {
        question_statement: question.question_statement,
        option1: question.option1,
        option2: question.option2,
        option3: question.option3,
        option4: question.option4,
        correct_option: question.correct_option
      });

      if (updatedQuestion) {
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        alert('Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Error updating question');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setOperationLoading(true);
      try {
        const success = await deleteQuestion(id.toString());
        if (success) {
          fetchQuestions();
        } else {
          alert('Failed to delete question');
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const renderChapterManagement = () => {
    if (!selectedSubject) return null;

    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              setSelectedSubject(null);
              setSelectedChapter(null);
            }}
            className="text-blue-500 hover:text-blue-700 mr-4"
          >
            &larr; Back to Subjects
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">
            Chapters for {selectedSubject.name}
          </h2>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setIsAddChapterModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <span className="mr-2">+</span> Add New Chapter
          </button>
        </div>

        {chaptersLoading ? (
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
        ) : chaptersError ? (
          <p className="text-red-600 text-sm">{chaptersError}</p>
        ) : (
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chapters.map((chapter) => (
                  <tr key={chapter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chapter.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chapter.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {chapter.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingChapter(chapter)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedChapter(chapter)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Manage Quizzes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Chapter Modal */}
        {isAddChapterModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Chapter</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Name</label>
                  <input
                    type="text"
                    value={newChapter.name}
                    onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter chapter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newChapter.description}
                    onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter chapter description"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddChapterModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChapter}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Add Chapter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Chapter Modal */}
        {editingChapter && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Chapter</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Name</label>
                  <input
                    type="text"
                    value={editingChapter.name}
                    onChange={(e) => setEditingChapter({ ...editingChapter, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingChapter.description || ''}
                    onChange={(e) => setEditingChapter({ ...editingChapter, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingChapter(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditChapter(editingChapter)}
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

  const renderQuizManagement = () => {
    if (!selectedChapter) return null;

    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              setSelectedChapter(null);
            }}
            className="text-blue-500 hover:text-blue-700 mr-4"
          >
            &larr; Back to Chapters
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">
            Quizzes for {selectedChapter.name}
          </h2>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setIsAddQuizModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <span className="mr-2">+</span> Add New Quiz
          </button>
        </div>

        {quizzesLoading ? (
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
        ) : quizzesError ? (
          <p className="text-red-600 text-sm">{quizzesError}</p>
        ) : (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration (min)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quiz.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quiz.remarks || 'No remarks'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quiz.duration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quiz.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quiz.end_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingQuiz(quiz)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedQuiz(quiz)}
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
        )}

        {/* Add Quiz Modal */}
        {isAddQuizModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Quiz</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={newQuiz.remarks}
                    onChange={(e) => setNewQuiz({ ...newQuiz, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quiz remarks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newQuiz.duration}
                    onChange={(e) => setNewQuiz({ ...newQuiz, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter duration"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newQuiz.start_time}
                    onChange={(e) => setNewQuiz({ ...newQuiz, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={newQuiz.end_time}
                    onChange={(e) => setNewQuiz({ ...newQuiz, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddQuizModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuiz}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Add Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Quiz Modal */}
        {editingQuiz && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Quiz</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={editingQuiz.remarks || ''}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editingQuiz.duration}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={editingQuiz.start_time.split('.')[0]} // Remove milliseconds for datetime-local input
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={editingQuiz.end_time.split('.')[0]} // Remove milliseconds for datetime-local input
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingQuiz(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditQuiz(editingQuiz)}
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

  const renderQuestionManagement = () => {
    if (!selectedQuiz) return null;

    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              setSelectedQuiz(null);
            }}
            className="text-blue-500 hover:text-blue-700 mr-4"
          >
            &larr; Back to Quizzes
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">
            Questions for Quiz: {selectedQuiz.remarks}
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
                    Question
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correct Option
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
                    <td className="px-6 py-4 text-sm text-gray-900">{question.question_statement}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Option {question.correct_option}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingQuestion(question)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
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

        {/* Add Question Modal */}
        {isAddQuestionModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Statement</label>
                  <textarea
                    value={newQuestion.question_statement}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question_statement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the question"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option 1</label>
                    <input
                      type="text"
                      value={newQuestion.option1}
                      onChange={(e) => setNewQuestion({ ...newQuestion, option1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option 2</label>
                    <input
                      type="text"
                      value={newQuestion.option2}
                      onChange={(e) => setNewQuestion({ ...newQuestion, option2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option 3</label>
                    <input
                      type="text"
                      value={newQuestion.option3}
                      onChange={(e) => setNewQuestion({ ...newQuestion, option3: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option 3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option 4</label>
                    <input
                      type="text"
                      value={newQuestion.option4}
                      onChange={(e) => setNewQuestion({ ...newQuestion, option4: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Option 4"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option</label>
                  <select
                    value={newQuestion.correct_option}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correct_option: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Option 1</option>
                    <option value={2}>Option 2</option>
                    <option value={3}>Option 3</option>
                    <option value={4}>Option 4</option>
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
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Statement</label>
                  <textarea
                    value={editingQuestion.question_statement}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question_statement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option 1</label>
                    <input
                      type="text"
                      value={editingQuestion.option1}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, option1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option 2</label>
                    <input
                      type="text"
                      value={editingQuestion.option2}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, option2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option 3</label>
                    <input
                      type="text"
                      value={editingQuestion.option3}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, option3: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option 4</label>
                    <input
                      type="text"
                      value={editingQuestion.option4}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, option4: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option</label>
                  <select
                    value={editingQuestion.correct_option}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_option: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Option 1</option>
                    <option value={2}>Option 2</option>
                    <option value={3}>Option 3</option>
                    <option value={4}>Option 4</option>
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

  // Show question management if a quiz is selected
  if (selectedQuiz) {
    return renderQuestionManagement();
  }

  // Show quiz management if a chapter is selected
  if (selectedChapter) {
    return renderQuizManagement();
  }

  // Show chapter management if a subject is selected
  if (selectedSubject) {
    return renderChapterManagement();
  }

  // Show subject management by default
  if (loading) {
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

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Subject Management</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
        >
          <span className="mr-2">+</span> Add New Subject
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjects.map((subject) => (
              <tr key={subject.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {subject.description || 'No description'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setEditingSubject(subject)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-red-600 hover:text-red-900 mr-3"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedSubject(subject)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Manage Chapters
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Subject</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject description"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Subject</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingSubject.description || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingSubject(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSubject(editingSubject)}
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

export default SubjectManagement;