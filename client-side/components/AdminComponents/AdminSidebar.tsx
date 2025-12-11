// components/AdminComponents/AdminSidebar.tsx
import { Dispatch, SetStateAction } from 'react';
import Logout from '../Auth/Logout';
import { 
  LayoutDashboard, 
  BookOpen, 
  Code2, 
  GitPullRequest, 
  Users, 
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  const { data: session } = useSession();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'users', label: 'User Management', icon: <Users size={20} /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen size={20} /> },
    { id: 'coding', label: 'Coding Arena', icon: <Code2 size={20} /> },
    { id: 'hiring-process', label: 'Hiring Process', icon: <GitPullRequest size={20} /> },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl z-50">
      
      {/* Branding */}
      <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3 text-blue-500">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/20">
             <img src="/icon.png"></img>
           </div>
           <div>
             <h2 className="text-xl font-bold text-white tracking-wide">SmartHire</h2>
             <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Admin Panel</span>
           </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          Administration
        </h3>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-600/10 text-blue-400' 
                      : 'hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                  )}
                  <span className={isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-white transition-colors'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Admin User Profile */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer group">
          <div className="bg-slate-800 rounded-full h-10 w-10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Admin User'}</p>
            <p className="text-xs text-slate-500 truncate">{session?.user?.email || 'admin@smarthire.com'}</p>
          </div>
          <div className="text-slate-500 hover:text-red-400 transition-colors">
            <Logout />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;