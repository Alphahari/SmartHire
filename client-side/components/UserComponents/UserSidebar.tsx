'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Logout from '../Auth/Logout';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  BarChart2, 
  History, 
  Code, 
  FileText, 
  Mic, 
  Bot, 
  User,
  LogOut
} from 'lucide-react';

const UserSidebar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'subjects';

  const menuItems = [
    { 
      section: "Learning",
      items: [
        { id: 'subjects', label: 'My Subjects', icon: <LayoutDashboard size={20} />, href: '/dashboard?tab=subjects' },
        { id: 'coding', label: 'Code Arena', icon: <Code size={20} />, href: '/dashboard?tab=coding' },
        { id: 'mock-tests', label: 'Mock Tests', icon: <FileText size={20} />, href: '/mock-tests' },
      ]
    },
    { 
      section: "Career Prep",
      items: [
        { id: 'interview', label: 'Interview Prep', icon: <Mic size={20} />, href: '/interview' },
        { id: 'interview-ai', label: 'AI Mock Interview', icon: <Bot size={20} />, href: '/interview/ai' },
      ]
    },
    { 
      section: "Analytics",
      items: [
        { id: 'stats', label: 'My Statistics', icon: <BarChart2 size={20} />, href: '/dashboard?tab=stats' },
        { id: 'past-quizzes', label: 'History', icon: <History size={20} />, href: '/dashboard?tab=past-quizzes' },
      ]
    }
  ];

  const isActive = (href: string, id: string) => {
    if (pathname === '/dashboard') {
      return activeTab === id;
    }
    return pathname === href;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl z-50">
      
      {/* Branding */}
      <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2 text-blue-500">
           {/* Simple Logo Icon */}
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg"><img src="icon.png"></img></div>
           <h2 className="text-xl font-bold text-white tracking-wide">SmartHire</h2>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-6 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        {menuItems.map((group, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              {group.section}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href, item.id);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                        ${active 
                          ? 'bg-blue-600/10 text-blue-400' 
                          : 'hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                      )}
                      <span className={active ? 'text-blue-500' : 'text-slate-400 group-hover:text-white'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer group">
          <div className="bg-slate-800 rounded-full h-10 w-10 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <User size={18} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
          </div>
          <div className="text-slate-500 hover:text-red-400 transition-colors">
            {/* Assuming Logout component wraps the logic, usually we pass a trigger */}
            <Logout /> 
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSidebar;