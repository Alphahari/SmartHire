// components/SubjectGrid.tsx
import { Subject } from '@/types/Subject';
import { useRouter } from 'next/navigation';

interface SubjectGridProps {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
}

const SubjectGrid = ({ subjects, loading, error }: SubjectGridProps) => {
  const router = useRouter();

  const handleExploreClick = (subjectId: number) => {
    router.push(`/subjects/${subjectId}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
    <>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Subjects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white shadow-md hover:shadow-xl border border-gray-200 rounded-xl p-6 transition duration-300 ease-in-out flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
                {subject.name}
              </h3>
              <p className="text-sm text-gray-600 text-center">
                {subject.description
                  ? subject.description
                  : 'No description available.'}
              </p>
            </div>
            <button 
              onClick={() => handleExploreClick(subject.id)}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Explore
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default SubjectGrid;