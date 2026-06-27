import { useDemo } from '../context/DemoContext';
import { UserCircle, ShieldCheck, TrendingUp, CheckCircle2, History, Settings, ArrowLeft, Wallet, Gift, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function Profile() {
  const { trustScore, userRole, setRole, walletBalance, walletTransactions } = useDemo();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-transparent min-h-screen">
      <div className="bg-white dark:bg-slate-900 px-6 pt-6 pb-4 border-b border-[#e2e8f0] dark:border-slate-800 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <UserCircle className="w-6 h-6 text-[#0f284b] dark:text-blue-400" />
            Profile
          </h1>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        
        {showSettings && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settings</p>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Demo Role Switch</label>
              <div className="flex gap-2 bg-[#f8f9fc] dark:bg-slate-900 p-1.5 rounded-full border border-[#e2e8f0] dark:border-slate-700">
                <button 
                  onClick={() => setRole('citizen')}
                  className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all ${userRole === 'citizen' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-[#e2e8f0] dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Citizen
                </button>
                <button 
                  onClick={() => { setRole('admin'); navigate('/dashboard'); }}
                  className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all ${userRole === 'admin' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-[#e2e8f0] dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Reviewer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Civic Trust Header */}
        <div className="bg-[#0f284b] rounded-[32px] p-6 text-white shadow-sm relative overflow-hidden flex flex-col gap-1">
          <div className="absolute -top-4 -right-4 p-4 opacity-10">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Civic Reliability Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black tracking-tight">{trustScore}</span>
              <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full text-white flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
                <TrendingUp className="w-3.5 h-3.5" /> Active Contributor
              </span>
            </div>
            <p className="text-xs font-medium text-slate-300 mt-2">High evidence quality standing.</p>
          </div>
        </div>

        {/* Civic Wallet Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[32px] p-6 text-white shadow-sm relative overflow-hidden flex flex-col gap-1 mt-2">
          <div className="absolute -bottom-6 -right-4 p-4 opacity-20">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Civic Wallet
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black tracking-tight">${walletBalance.toFixed(2)}</span>
            </div>
            <p className="text-xs font-medium text-emerald-50 mt-2">Earned from verification bounties & civic contributions.</p>
            
            <div className="flex gap-2 mt-4">
              <button className="bg-white text-emerald-700 px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-emerald-50 transition-colors flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" /> Redeem
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Recent Impact</h2>
          <div className="bg-white rounded-[24px] border border-[#e2e8f0] shadow-sm p-5 grid grid-cols-3 gap-4 divide-x divide-slate-100 text-center">
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-2xl font-black text-[#0f284b]">3</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports Logged</span>
            </div>
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-2xl font-black text-blue-600">8</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evidence Accepted</span>
            </div>
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-2xl font-black text-emerald-600">2</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cases Resolved</span>
            </div>
          </div>
        </div>

        {/* Contribution History */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Operations Log
          </h2>
          <div className="bg-white rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col divide-y divide-[#e2e8f0] overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900">Verified Evidence: Pothole</span>
                  <span className="text-[10px] font-medium text-slate-500">2 hours ago - Indiranagar</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900">Submitted Report: Streetlight</span>
                  <span className="text-[10px] font-medium text-slate-500">1 day ago - Koramangala</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900">Flagged Duplicate</span>
                  <span className="text-[10px] font-medium text-slate-500">2 days ago - HSR Layout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet History */}
        <div className="flex flex-col gap-3 pb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Wallet History
          </h2>
          <div className="bg-white rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col divide-y divide-[#e2e8f0] overflow-hidden">
            {walletTransactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${tx.type === 'earn' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    {tx.type === 'earn' ? <TrendingUp className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-slate-900">{tx.description}</span>
                    <span className="text-[10px] font-medium text-slate-500">{tx.timestamp}</span>
                  </div>
                </div>
                <span className={`text-sm font-black ${tx.type === 'earn' ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {tx.type === 'earn' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
