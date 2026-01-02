import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { api } from './services/backend';
import Auth from './components/Auth';
import Chat from './components/Chat';
import Announcements from './components/Announcements';
import Schedule from './components/Schedule';
import Quiz from './components/Quiz';
import { MessageSquare, Bell, Calendar, Brain, LogOut, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = await api.auth.getCurrentUser();
      setUser(storedUser);
      setLoading(false);
    };
    initAuth();
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Chargement...</div>;

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <HashRouter>
      <div className="flex min-h-screen font-sans bg-transparent">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-[#151521]/95 backdrop-blur-md border-r border-[#2A2A35] hidden md:flex flex-col fixed h-full z-10">
          <div className="p-6 border-b border-[#2A2A35]">
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-chinese flex items-center gap-2">
                Mandarin Connect
            </h1>
            <p className="text-xs text-slate-500 mt-1">L1 G5 Group</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavLink to="/chat" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-violet-500/10 text-violet-400 font-medium shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'text-slate-400 hover:bg-[#1E1E2E] hover:text-slate-200'}`}>
              <MessageSquare size={20} /> Discussion
            </NavLink>
            <NavLink to="/announcements" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-violet-500/10 text-violet-400 font-medium shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'text-slate-400 hover:bg-[#1E1E2E] hover:text-slate-200'}`}>
              <Bell size={20} /> Annonces
            </NavLink>
            <NavLink to="/schedule" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-violet-500/10 text-violet-400 font-medium shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'text-slate-400 hover:bg-[#1E1E2E] hover:text-slate-200'}`}>
              <Calendar size={20} /> Emploi du temps
            </NavLink>
            <NavLink to="/quiz" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-violet-500/10 text-violet-400 font-medium shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'text-slate-400 hover:bg-[#1E1E2E] hover:text-slate-200'}`}>
              <Brain size={20} /> Quiz & IA
            </NavLink>
          </nav>

          <div className="p-4 border-t border-[#2A2A35]">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-[#0B0B15]/50 rounded-xl border border-[#2A2A35]">
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 rounded-full text-white">
                    <UserIcon size={16} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-500 hover:text-red-400 transition-colors text-sm"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </aside>

        {/* Mobile Nav (Bottom) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#151521]/95 backdrop-blur-md border-t border-[#2A2A35] z-50 flex justify-around p-3 pb-safe">
             <NavLink to="/chat" className={({ isActive }) => `p-2 rounded-lg ${isActive ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500'}`}><MessageSquare size={24} /></NavLink>
             <NavLink to="/announcements" className={({ isActive }) => `p-2 rounded-lg ${isActive ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500'}`}><Bell size={24} /></NavLink>
             <NavLink to="/schedule" className={({ isActive }) => `p-2 rounded-lg ${isActive ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500'}`}><Calendar size={24} /></NavLink>
             <NavLink to="/quiz" className={({ isActive }) => `p-2 rounded-lg ${isActive ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500'}`}><Brain size={24} /></NavLink>
        </nav>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/chat" element={<Chat currentUser={user} />} />
            <Route path="/announcements" element={<Announcements currentUser={user} />} />
            <Route path="/schedule" element={<Schedule currentUser={user} />} />
            <Route path="/quiz" element={<Quiz currentUser={user} />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;