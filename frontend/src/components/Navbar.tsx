import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Megaphone, LogOut, ShieldCheck, UserCheck, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Megaphone className="w-5 h-5 transform -rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">PulseDesk</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                BIZ HACK '26
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">Office Announcement Management System</p>
          </div>
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isAdmin 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
            }`}>
              {user.name.charAt(0)}
            </div>
            
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">{user.name}</span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                    <UserCheck className="w-3 h-3" /> Employee
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Building className="w-3 h-3 text-slate-400" />
                <span>{user.department} Department</span>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            id="logout-button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
            title="Sign out of your account"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
