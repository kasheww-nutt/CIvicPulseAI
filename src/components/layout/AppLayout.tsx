import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { Shield, Home, Target, LayoutDashboard, Plus, Settings, CheckCircle2, UserCircle, Compass, MessageCircle, Moon, Sun, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { TrustScoreReward } from '../shared/TrustScoreReward';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../lib/i18n';
import { NotificationBell } from '../shared/NotificationBell';
import { GeofenceWatcher } from '../shared/GeofenceWatcher';

export function AppLayout() {
  const { userRole, trustScore, setRole, isDarkMode, toggleDarkMode } = useDemo();
  const { signOut, language } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const t = useTranslation(language);

  // Determine if we should constrain width for a mobile-first feel
  const isCitizenFlow = userRole === 'citizen' && !location.pathname.startsWith('/dashboard');
  const showBottomNav = isCitizenFlow && !location.pathname.startsWith('/case/') && !location.pathname.startsWith('/report') && !location.pathname.startsWith('/escalation');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-slate-100 dark:bg-slate-950 font-sans flex justify-center text-slate-900 dark:text-slate-100",
      // On desktop, citizen flow looks like a centered phone app, admin looks wide
      isCitizenFlow ? "" : "bg-slate-50 dark:bg-slate-950"
    )}>
      
      <div className={cn(
        "w-full bg-[#f8f9fc] dark:bg-[#0a0f1c] min-h-screen relative shadow-2xl flex flex-col mx-auto",
        isCitizenFlow ? "max-w-[430px] border-x border-[#e2e8f0] dark:border-slate-800" : "max-w-6xl border-none shadow-none"
      )}>
        
        {/* Top App Bar (Compact Android Style) */}
        {location.pathname !== '/' && (
          <header className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-transparent dark:border-slate-800">
            <div className="flex items-center gap-2">
              <img src="/chatgpt_logo_full.png" alt="Logo" className="h-6 w-auto object-contain dark:brightness-0 dark:invert" />
            </div>

            <div className="flex items-center gap-3 relative">
              {userRole === 'citizen' && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0f284b] dark:text-blue-400" />
                  <span className="text-xs font-bold">{trustScore}</span>
                </div>
              )}
              
              <button onClick={toggleDarkMode} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white ml-1">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <NotificationBell />

              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <UserCircle className="w-6 h-6" />
              </button>

              {showProfileMenu && (
                <div className="absolute top-10 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl py-2 w-48 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Profile</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{userRole === 'admin' ? 'Reviewer View' : 'Citizen View'}</p>
                  </div>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => { setRole('citizen'); setShowProfileMenu(false); navigate('/'); }}
                  >
                    {t('app.switchCitizen')}
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => { setRole('admin'); setShowProfileMenu(false); navigate('/dashboard'); }}
                  >
                    {t('app.switchReviewer')}
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4" />
                      {t('app.signout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>
        )}

        <main className={cn(
          "flex-1 w-full mx-auto",
          showBottomNav ? "pb-20" : "pb-safe md:pb-0",
          isCitizenFlow ? "" : "p-4 md:p-8"
        )}>
          <Outlet />
        </main>

        {/* Bottom Navigation (Android PWA Style) */}
        {showBottomNav ? (
          <div className="fixed bottom-0 left-0 right-0 w-full max-w-[430px] mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-30 pb-safe shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.3)] h-20">
            <NavItem to="/" icon={<Home />} label={t('nav.home')} active={location.pathname === '/'} />
            <NavItem to="/cases" icon={<Compass />} label={t('nav.cases')} active={location.pathname === '/cases'} />
            
            {/* Center Floating Action Button (FAB) */}
            <div className="flex-1 flex justify-center mt-[-30px]">
              <button 
                onClick={() => navigate('/report')}
                aria-label="Report new issue"
                className="w-14 h-14 bg-[#1448db] dark:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0f36a8] dark:hover:bg-blue-700 transition-transform active:scale-95 z-40 border-4 border-white dark:border-slate-900"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <NavItem to="/missions" icon={<MessageCircle />} label={t('nav.missions')} active={location.pathname === '/missions'} />
            <NavItem to="/profile" icon={<UserCircle />} label={t('nav.profile')} active={location.pathname === '/profile'} />
          </div>
        ) : !isCitizenFlow && (
          <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around md:hidden z-30 pb-safe h-16">
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label={t('nav.dashboard')} active={location.pathname === '/dashboard'} />
            <NavItem to="/" icon={<Home />} label="App Preview" active={location.pathname === '/'} />
          </nav>
        )}
        
        <TrustScoreReward score={trustScore} />
        <GeofenceWatcher />

      </div>
    </div>
  )
}

import type { ReactNode } from 'react';

function NavItem({ to, icon, label, active }: { to: string, icon: ReactNode, label: string, active: boolean }) {
  return (
    <Link to={to} className={cn(
      "flex flex-col items-center justify-center gap-1 min-w-[50px] h-full flex-1 transition-colors relative", 
      active ? "text-[#1448db] dark:text-blue-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
    )}>
      <div className={cn(
        "w-8 h-8 flex items-center justify-center transition-all", 
        active && "text-[#1448db] dark:text-blue-400"
      )}>
        <div className={cn("w-6 h-6 transition-transform", active && "scale-110")}>{icon}</div>
      </div>
      <span className={cn("text-[10px] tracking-wide", active ? "font-bold" : "font-medium")}>{label}</span>
    </Link>
  )
}

