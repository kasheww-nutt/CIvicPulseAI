import { useDemo } from '../context/DemoContext';
import { MissionRow } from '../components/shared/MissionRow';
import { LayoutDashboard, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function MyCases() {
  const { cases, verifyCase } = useDemo();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'verified' | 'resolved'>('active');

  // Simple mocking: cases that are verified by me
  const verifiedCases = cases.filter(c => c.verifiedByMe);
  
  // Resolved cases
  const resolvedCases = cases.filter(c => c.status === 'Resolved' || c.status === 'Fix Verified');
  
  // Reported / followed cases (for demo, just take cases that aren't resolved or verified)
  const activeCases = cases.filter(c => !c.verifiedByMe && c.status !== 'Resolved' && c.status !== 'Fix Verified').slice(0, 3);

  const getActiveList = () => {
    switch(activeTab) {
      case 'active': return activeCases;
      case 'verified': return verifiedCases;
      case 'resolved': return resolvedCases;
    }
  };

  const list = getActiveList();

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-20">
      <div className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="p-1 -ml-1 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            My Cases
          </h1>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 text-xs font-bold py-2 rounded-md transition-colors ${activeTab === 'active' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Active ({activeCases.length})
          </button>
          <button 
            onClick={() => setActiveTab('verified')}
            className={`flex-1 text-xs font-bold py-2 rounded-md transition-colors ${activeTab === 'verified' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Verified ({verifiedCases.length})
          </button>
          <button 
            onClick={() => setActiveTab('resolved')}
            className={`flex-1 text-xs font-bold py-2 rounded-md transition-colors ${activeTab === 'resolved' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Resolved ({resolvedCases.length})
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {list.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {list.map(c => (
              <MissionRow 
                key={c.id} 
                item={c} 
                onVerify={() => verifyCase(c.id, 'verify')}
                compact={false}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <ShieldCheck className="w-12 h-12 text-slate-300" />
            <div>
              <h3 className="text-sm font-semibold text-slate-700">No active cases</h3>
              <p className="text-xs mt-1 text-slate-500">Cases you report or follow will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
