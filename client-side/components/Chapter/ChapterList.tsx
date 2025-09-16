// components/Chapter/ChapterList.tsx
import { Chapter } from '@/types/Chapter';
import { useRouter } from 'next/navigation';

interface ChapterListProps {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  subjectId: number;
}

const ChapterList = ({ chapters, loading, error, subjectId }: ChapterListProps) => {
  const router = useRouter();

  const handleChapterClick = (chapterId: number) => {
    router.push(`/subjects/${subjectId}/chapters/${chapterId}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  if (chapters.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-600">No chapters available for this subject.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {chapters.map((chapter) => (
        <div
          key={chapter.id}
          className="bg-white shadow-md hover:shadow-xl border border-gray-200 rounded-xl p-6 transition duration-300 ease-in-out cursor-pointer"
          onClick={() => handleChapterClick(chapter.id)}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {chapter.name}
          </h3>
          <p className="text-sm text-gray-600">
            {chapter.description || 'No description available.'}
          </p>
          <div className="mt-4">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              Click to view quizzes
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChapterList;