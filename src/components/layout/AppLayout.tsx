import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { Shield, Home, Target, LayoutDashboard, PlusCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const { userRole, trustScore } = useDemo();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans pb-20 md:pb-0 md:flex">
       {/* Sidebar for desktop / Topbar for mobile */}
       <header className="bg-white border-b border-slate-200 md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-20 shadow-sm">
         <div className="flex items-center gap-2">
           <div className="bg-blue-600 p-1.5 rounded-md">
             <Shield className="w-5 h-5 text-white" />
           </div>
           <span className="font-bold text-lg tracking-tight text-slate-900">CivicPulse</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-sm">
             <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
             Trust: {trustScore}
           </div>
         </div>
       </header>

       {/* Bottom Nav Mobile */}
       <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex items-center justify-around z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <NavItem to="/" icon={<Home />} label="Home" active={location.pathname === '/'} />
         <NavItem to="/missions" icon={<Target />} label="Missions" active={location.pathname === '/missions'} />
         <NavItem to="/report" icon={<PlusCircle />} label="Report" active={location.pathname.startsWith('/report')} />
         {userRole === 'admin' && (
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Admin" active={location.pathname === '/dashboard'} />
         )}
       </nav>

       {/* Desktop Nav */}
       <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shadow-sm z-10">
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
             <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
               <Shield className="w-6 h-6 text-white" />
             </div>
             <span className="font-bold text-xl tracking-tight text-slate-900">CivicPulse AI</span>
          </div>
          
          <div className="p-4 border-b border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Demo Identity</span>
              <span className="font-semibold text-slate-900 text-sm">{userRole === 'admin' ? 'Operations Reviewer' : 'Asha (Citizen)'}</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-blue-700 bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100">
                <CheckCircle2 className="w-4 h-4" /> Trust Score: {trustScore}
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 flex flex-col gap-1.5">
            <DesktopNavItem to="/" icon={<Home />} label="Citizen Home" active={location.pathname === '/'} />
            <DesktopNavItem to="/missions" icon={<Target />} label="Nearby Missions" active={location.pathname === '/missions'} />
            <DesktopNavItem to="/report" icon={<PlusCircle />} label="Report Issue" active={location.pathname.startsWith('/report')} />
            {userRole === 'admin' && (
              <DesktopNavItem to="/dashboard" icon={<LayoutDashboard />} label="Civic Dashboard" active={location.pathname === '/dashboard'} />
            )}
          </nav>
       </aside>

       <main className="flex-1 mx-auto w-full p-4 md:p-8 max-w-6xl">
         <Outlet />
       </main>
    </div>
  )
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link to={to} className={cn("flex flex-col items-center gap-1 p-3 flex-1 transition-colors", active ? "text-blue-600" : "text-slate-500 hover:text-slate-900")}>
      <div className={cn("w-6 h-6 transition-transform", active && "scale-110")}>{icon}</div>
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </Link>
  )
}

function DesktopNavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link to={to} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-sm", active ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent")}>
      <div className="w-5 h-5">{icon}</div>
      <span>{label}</span>
    </Link>
  )
}
