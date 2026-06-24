import { useDemo } from '../context/DemoContext';
import { UserCircle, ShieldCheck, TrendingUp, CheckCircle2, History, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { trustScore, userRole, setRole } = useDemo();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-20">
      <div className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 -ml-1 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-600" />
            Profile
          </h1>
        </div>
        <button className="text-slate-400 hover:text-slate-900">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-6">
        
        {/* Civic Trust Header */}
        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-sm relative overflow-hidden flex flex-col gap-1">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Civic Reliability Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold">{trustScore}</span>
              <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded text-slate-200 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Active Contributor
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">High evidence quality standing.</p>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Recent Impact</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-3 gap-4 divide-x divide-slate-100 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-slate-900">3</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Reports Logged</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-blue-600">8</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Evidence Accepted</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-green-600">2</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cases Resolved</span>
            </div>
          </div>
        </div>

        {/* Contribution History */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Operations Log
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col divide-y divide-slate-100">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">Verified Evidence: Pothole</span>
                  <span className="text-[10px] font-medium text-slate-500">2 hours ago - Indiranagar</span>
                </div>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <UserCircle className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">Submitted Report: Streetlight</span>
                  <span className="text-[10px] font-medium text-slate-500">1 day ago - Koramangala</span>
                </div>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">Flagged Duplicate</span>
                  <span className="text-[10px] font-medium text-slate-500">2 days ago - HSR Layout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Switch */}
        <div className="mt-2 flex items-center justify-between px-1 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Demo Role Switch</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setRole('citizen')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${userRole === 'citizen' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Citizen
            </button>
            <button 
              onClick={() => { setRole('admin'); navigate('/dashboard'); }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${userRole === 'admin' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Reviewer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
