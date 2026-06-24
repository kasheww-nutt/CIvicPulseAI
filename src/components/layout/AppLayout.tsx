import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { Shield, Home, Target, LayoutDashboard, Plus, Settings, CheckCircle2, UserCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export function AppLayout() {
  const { userRole, trustScore, setRole } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Determine if we should constrain width for a mobile-first feel
  const isCitizenFlow = userRole === 'citizen' && !location.pathname.startsWith('/dashboard');

  return (
    <div className={cn(
      "min-h-screen bg-slate-100 font-sans flex justify-center",
      // On desktop, citizen flow looks like a centered phone app, admin looks wide
      isCitizenFlow ? "" : "bg-slate-50"
    )}>
      
      <div className={cn(
        "w-full bg-slate-50 min-h-screen relative shadow-2xl flex flex-col",
        isCitizenFlow ? "max-w-[430px] border-x border-slate-200" : "max-w-6xl border-none shadow-none"
      )}>
        
        {/* Top App Bar (Compact Android Style) */}
        <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">CivicPulse</span>
          </div>

          <div className="flex items-center gap-3 relative">
            {userRole === 'citizen' && (
              <div className="flex items-center gap-1.5 bg-teal-50 px-2 py-1 rounded-full border border-teal-100 text-teal-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{trustScore}</span>
              </div>
            )}
            
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="text-slate-500 hover:text-slate-900">
              <UserCircle className="w-6 h-6" />
            </button>

            {showProfileMenu && (
              <div className="absolute top-10 right-0 bg-white border border-slate-200 shadow-lg rounded-xl py-2 w-48 z-50">
                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Profile</p>
                  <p className="text-sm font-semibold text-slate-900">{userRole === 'admin' ? 'Reviewer View' : 'Citizen View'}</p>
                </div>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => { setRole('citizen'); setShowProfileMenu(false); navigate('/'); }}
                >
                  Switch to Citizen
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => { setRole('admin'); setShowProfileMenu(false); navigate('/dashboard'); }}
                >
                  Switch to Reviewer
                </button>
              </div>
            )}
          </div>
        </header>

        <main className={cn(
          "flex-1 w-full mx-auto pb-24", // pb-24 to account for bottom nav and FAB
          isCitizenFlow ? "" : "p-4 md:p-8"
        )}>
          <Outlet />
        </main>

        {/* Floating Action Button for Report - Citizen Flow */}
        {isCitizenFlow && location.pathname !== '/report' && (
          <button 
            onClick={() => navigate('/report')}
            className="fixed bottom-20 right-4 md:absolute md:bottom-20 md:right-4 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 z-30"
          >
            <Plus className="w-7 h-7" />
          </button>
        )}

        {/* Bottom Navigation (Android PWA Style) */}
        {isCitizenFlow ? (
          <nav className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-slate-200 flex items-center justify-between px-2 z-30 pb-safe shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
            <NavItem to="/" icon={<Home />} label="Home" active={location.pathname === '/'} />
            <NavItem to="/missions" icon={<Target />} label="Missions" active={location.pathname === '/missions'} />
            <div className="w-16" /> {/* Spacer for visual balance if needed, or just regular items */}
            <NavItem to="/cases" icon={<LayoutDashboard />} label="My Cases" active={location.pathname === '/cases'} />
            <NavItem to="/profile" icon={<UserCircle />} label="Trust" active={location.pathname === '/profile'} />
          </nav>
        ) : (
          <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex items-center justify-around md:hidden z-30 pb-safe">
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" active={location.pathname === '/dashboard'} />
            <NavItem to="/" icon={<Home />} label="App Preview" active={location.pathname === '/'} />
          </nav>
        )}

      </div>
    </div>
  )
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link to={to} className={cn(
      "flex flex-col items-center gap-1 p-2 min-w-[64px] flex-1 transition-colors", 
      active ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-all", 
        active && "bg-blue-50"
      )}>
        <div className={cn("w-5 h-5 transition-transform", active && "scale-110")}>{icon}</div>
      </div>
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </Link>
  )
}

