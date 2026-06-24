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
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-100">Civic Trust Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{trustScore}</span>
              <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded-lg flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12 this week
              </span>
            </div>
            <p className="text-sm font-medium text-teal-50 mt-2">Level 4: Reliable Citizen</p>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Weekly Activity</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-3 gap-4 divide-x divide-slate-100 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-slate-900">3</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reported</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-blue-600">8</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verified</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-green-600">2</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resolved</span>
            </div>
          </div>
        </div>

        {/* Contribution History */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Recent History
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col divide-y divide-slate-100">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Verified Pothole</span>
                  <span className="text-[10px] font-semibold text-slate-500">2 hours ago • Indiranagar</span>
                </div>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+5 TS</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <UserCircle className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Reported Streetlight</span>
                  <span className="text-[10px] font-semibold text-slate-500">1 day ago • Koramangala</span>
                </div>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+10 TS</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Verified Duplicate</span>
                  <span className="text-[10px] font-semibold text-slate-500">2 days ago • HSR Layout</span>
                </div>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+8 TS</span>
            </div>
          </div>
        </div>

        {/* Profile Switch */}
        <div className="mt-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">Developer Options</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setRole('citizen')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${userRole === 'citizen' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              Citizen View
            </button>
            <button 
              onClick={() => { setRole('admin'); navigate('/dashboard'); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${userRole === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              Reviewer View
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
