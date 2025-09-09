import { Dispatch, SetStateAction } from 'react';
import Logout from '../Auth/Logout';

interface UserSidebarProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

const UserSidebar = ({ activeTab, setActiveTab }: UserSidebarProps) => {
  const menuItems = [
    { id: 'subjects', label: 'My Subjects', icon: '📚' },
    { id: 'stats', label: 'Statistics', icon: '📊' },
    { id: 'progress', label: 'Progress', icon: '🎯' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white shadow-lg">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Quizlytics Learner</h2>
        <p className="text-sm text-gray-400 mt-1">Expand your knowledge</p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === item.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
        <div className="flex items-center mb-4">
          <div className="bg-blue-500 rounded-full h-10 w-10 flex items-center justify-center mr-3">
            <span className="text-white">👤</span>
          </div>
          <div>
            <p className="text-sm font-medium">Learner User</p>
            <p className="text-xs text-gray-400">Basic Plan</p>
          </div>
        </div>
        <Logout />
      </div>
    </div>
  );
};

export default UserSidebar;