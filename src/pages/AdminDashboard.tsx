import { useDemo } from '../context/DemoContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LayoutDashboard, AlertCircle, TrendingUp, Users, CheckCircle2, Layers, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSeverityColor } from '../components/shared/CaseCard';
import { getLifecycleStage, getBlockerReason } from '../lib/caseLifecycle';

export function AdminDashboard() {
  const { cases } = useDemo();
  const navigate = useNavigate();

  const urgentVerificationNeeded = cases.filter(c => getLifecycleStage(c) === 'Community verification needed' && c.severity >= 4);
  const duplicateFusionReview = cases.filter(c => c.duplicateRisk === 'High' && getLifecycleStage(c) !== 'Closed');
  const packetPreparationQueue = cases.filter(c => getLifecycleStage(c) === 'Community verified');
  const fixVerificationQueue = cases.filter(c => getLifecycleStage(c) === 'Fix verification needed' || getLifecycleStage(c) === 'Field repair claimed');
  const closedCount = cases.filter(c => getLifecycleStage(c) === 'Closed' || getLifecycleStage(c) === 'Fix verified').length;
  
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-[#e2e8f0] dark:border-slate-700">
               <LayoutDashboard className="w-6 h-6 text-[#0f284b] dark:text-blue-400" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Civic Operations Console</h1>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Demo overview of priority issues and community verification signals.</p>
             </div>
          </div>
          <div className="hidden md:flex text-sm font-bold text-slate-500 dark:text-slate-400 items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-[#e2e8f0] dark:border-slate-700">
             <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
             </span>
             System Online
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="shadow-sm border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[24px]">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Urgent Verifications</span>
               <AlertCircle className="w-5 h-5 text-red-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{urgentVerificationNeeded.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[24px]">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Packets to Prepare</span>
               <TrendingUp className="w-5 h-5 text-blue-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{packetPreparationQueue.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[24px]">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duplicate Fusion</span>
               <Layers className="w-5 h-5 text-amber-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{duplicateFusionReview.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[24px]">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Closed</span>
               <CheckCircle2 className="w-5 h-5 text-emerald-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{closedCount}</span>
           </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Urgent Queue */}
         <section className="flex flex-col gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
             Urgent Verification Needed <Badge className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30 rounded-full px-2 py-0.5">{urgentVerificationNeeded.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {urgentVerificationNeeded.slice(0, 5).map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-5 rounded-[24px] shadow-sm flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full truncate max-w-[150px]">{c.category}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border shadow-sm shrink-0 ${getSeverityColor(c.severity)}`}>Sev {c.severity}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.title}</h3>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full w-fit border border-amber-200 dark:border-amber-800/30 mt-1">
                    Blocker: {getBlockerReason(c)}
                  </div>
                </div>
             ))}
             {urgentVerificationNeeded.length === 0 && (
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm font-medium shadow-sm">
                  No urgent verifications needed.
               </div>
             )}
           </div>
         </section>

         {/* Packet Preparation Queue */}
         <section className="flex flex-col gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
             Packet Preparation Queue <Badge className="bg-slate-100 dark:bg-slate-800 text-[#0f284b] dark:text-blue-400 border-[#e2e8f0] dark:border-slate-700 rounded-full px-2 py-0.5">{packetPreparationQueue.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {packetPreparationQueue.slice(0, 5).map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-5 rounded-[24px] shadow-sm flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full truncate max-w-[180px]">{c.suggestedDepartment}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f284b] dark:text-blue-400 bg-[#f8f9fc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 px-2 py-1 rounded-full shrink-0">Community Verified</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.title}</h3>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30 w-fit font-bold"><CheckCircle2 className="w-3.5 h-3.5"/> Verified by {c.verificationCount} citizens</span>
                    <span className="text-[#0f284b] dark:text-blue-400 font-bold hover:underline">Prepare Packet &rarr;</span>
                  </div>
                </div>
             ))}
             {packetPreparationQueue.length === 0 && (
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm font-medium shadow-sm">
                 No packets need preparation.
               </div>
             )}
           </div>
         </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Fix Verification Queue */}
         <section className="flex flex-col gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
             Fix Verification Queue <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30 rounded-full px-2 py-0.5">{fixVerificationQueue.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {fixVerificationQueue.slice(0, 5).map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-5 rounded-[24px] shadow-sm flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full truncate max-w-[150px]">{c.category}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/30 px-2 py-1 rounded-full shrink-0">Claimed Repair</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.title}</h3>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Awaiting citizen field verification.
                  </div>
                </div>
             ))}
             {fixVerificationQueue.length === 0 && (
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm font-medium shadow-sm">
                 No repairs pending verification.
               </div>
             )}
           </div>
         </section>

         {/* Duplicate Fusion Review */}
         <section className="flex flex-col gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
             Duplicate Fusion Review <Badge className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 rounded-full px-2 py-0.5">{duplicateFusionReview.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {duplicateFusionReview.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 p-5 rounded-[24px] shadow-sm flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 px-3 py-1.5 rounded-full flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> High Duplicate Risk</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.title}</h3>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending fusion check
                  </div>
                </div>
             ))}
             {duplicateFusionReview.length === 0 && (
               <div className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] text-center text-slate-500 text-sm font-medium shadow-sm">
                 No duplicates detected.
               </div>
             )}
           </div>
         </section>
      </div>

    </div>
  )
}
