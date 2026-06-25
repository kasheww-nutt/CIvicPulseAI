import { useDemo } from '../context/DemoContext';
import { MissionRow } from '../components/shared/MissionRow';
import { Target, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Missions() {
  const { cases, verifyCase, location } = useDemo();
  const navigate = useNavigate();

  const activeMissions = cases.filter(c => c.status !== 'Resolved' && c.status !== 'Fix Verified').sort((a, b) => {
    let scoreA = a.severity * 10;
    if (a.duplicateRisk === 'High') scoreA += 15;
    if (a.evidenceQuality === 'Low') scoreA += 10;
    if (a.locationSource === 'Manual pin') scoreA += 5;
    scoreA -= a.verificationCount;

    let scoreB = b.severity * 10;
    if (b.duplicateRisk === 'High') scoreB += 15;
    if (b.evidenceQuality === 'Low') scoreB += 10;
    if (b.locationSource === 'Manual pin') scoreB += 5;
    scoreB -= b.verificationCount;

    return scoreB - scoreA;
  });
  const resolvedMissions = cases.filter(c => c.status === 'Resolved');

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-20">
      <header className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-slate-900 md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200 shrink-0">
             <Target className="w-4 h-4 text-blue-700" />
           </div>
           <h1 className="text-lg font-bold text-slate-900 leading-tight">Nearby Missions</h1>
        </div>
      </header>

      <div className="p-4 flex flex-col gap-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 flex gap-3 text-sm text-amber-900 items-start shadow-sm">
           <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
           <div className="flex flex-col gap-0.5">
             <strong className="font-semibold text-amber-900 text-sm">Safety First</strong>
             <p className="text-amber-800 leading-snug text-xs">Do not enter unsafe or restricted areas. Observe from a safe distance.</p>
           </div>
        </div>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Cases
            </h2>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">+5 Trust</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {activeMissions.length > 0 ? (
              activeMissions.map(c => (
                <MissionRow 
                  key={c.id} 
                  item={c} 
                  onVerify={() => verifyCase(c.id, 'verify')} 
                />
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                 No active missions nearby right now.
              </div>
            )}
          </div>
        </section>

        {resolvedMissions.length > 0 && (
           <section className="flex flex-col gap-2 mt-2">
             <div className="flex items-center justify-between px-1 mb-1">
               <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                 Confirm Fixed
               </h2>
               <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">+12 Trust</span>
             </div>
             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
               {resolvedMissions.map(c => (
                 <MissionRow 
                   key={c.id} 
                   item={c} 
                   onVerify={() => verifyCase(c.id, 'fixed')} 
                 />
               ))}
             </div>
           </section>
        )}
      </div>
    </div>
  )
}

