import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDemo } from '../../context/DemoContext';
import { ShieldAlert, LogOut } from 'lucide-react';
import React from 'react';

export function ProtectedRoute() {
  const { user, loading, signOut, activePortal } = useAuth();
  const { suspendedUsers } = useDemo();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!activePortal) {
    return <Navigate to="/login" replace />;
  }

  // Check if current user is suspended (either by email or displayName)
  const isSuspended = suspendedUsers.includes(user.email || '') || 
                      suspendedUsers.includes(user.displayName || '') ||
                      (user.email === 'demo@civicpulse.ai' && suspendedUsers.includes('demo'));

  if (isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 font-sans text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/40 rounded-[32px] p-8 shadow-2xl flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Account Suspended</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Your account <strong>{user.email}</strong> has been flagged and suspended by the municipal administration.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-left w-full text-xs">
            <p className="font-extrabold text-slate-700 dark:text-slate-300">Reason for Sanction:</p>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Pattern manipulation, duplicate abuse, or suspicious self-verification detected by AI Integrity and Fraud Engine rules.
            </p>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 border-0"
          >
            <LogOut className="w-4 h-4" /> Sign Out from System
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
