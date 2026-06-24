import { useDemo } from '../context/DemoContext';
import { CaseCard } from '../components/shared/CaseCard';
import { Target, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export function Missions() {
  const { cases, verifyCase, location } = useDemo();

  const activeMissions = cases.filter(c => c.status !== 'Resolved' && c.status !== 'Fix Verified');
  const resolvedMissions = cases.filter(c => c.status === 'Resolved');

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200 shrink-0">
             <Target className="w-6 h-6 text-blue-700" />
           </div>
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nearby Missions</h1>
             <p className="text-sm text-slate-500 font-medium">Earn Civic Trust by verifying cases in {location || 'your area'}</p>
           </div>
        </div>
      </header>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-900 items-start shadow-sm">
         <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
         <div className="flex flex-col gap-1">
           <strong className="font-semibold text-amber-900">Safety First</strong>
           <p className="text-amber-800 leading-relaxed">Do not enter unsafe roads, restricted areas, or dangerous locations to verify a case. Observe from a safe distance.</p>
         </div>
      </div>

      <section className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            Active Cases <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">+5 Trust</Badge>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeMissions.map(c => (
            <CaseCard 
              key={c.id} 
              item={c} 
              onVerify={() => verifyCase(c.id, 'verify')} 
            />
          ))}
          {activeMissions.length === 0 && (
             <div className="col-span-full bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
               No active missions nearby right now.
             </div>
          )}
        </div>
      </section>

      {resolvedMissions.length > 0 && (
         <section className="mt-6 pt-6 border-t border-slate-200">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
               Confirm Fixed <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">+12 Trust</Badge>
             </h2>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {resolvedMissions.map(c => (
               <CaseCard 
                 key={c.id} 
                 item={c} 
                 onVerify={() => verifyCase(c.id, 'fixed')} 
               />
             ))}
           </div>
         </section>
      )}
    </div>
  )
}
