import { Dispatch, SetStateAction } from 'react';
import Logout from '../Auth/Logout';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
const menuItems = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'subjects', label: 'Subjects', icon: '📚' },
  { id: 'questions', label: 'Questions', icon: '❓' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white shadow-lg">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-semibold">SmartHire Admin</h2>
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
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
        <Logout />
      </div>
    </div>
  );
};

export default AdminSidebar;