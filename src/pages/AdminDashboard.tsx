import { useDemo } from '../context/DemoContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LayoutDashboard, AlertCircle, TrendingUp, Users, CheckCircle2, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSeverityColor } from '../components/shared/CaseCard';

export function AdminDashboard() {
  const { cases } = useDemo();
  const navigate = useNavigate();

  const urgentCases = cases.filter(c => c.severity >= 4 && c.status !== 'Resolved' && c.status !== 'Fix Verified');
  const readyCases = cases.filter(c => c.status === 'Authority Ready');
  const duplicateRiskCases = cases.filter(c => c.duplicateRisk === 'High' && c.status !== 'Resolved' && c.status !== 'Fix Verified');
  const resolvedCount = cases.filter(c => c.status === 'Resolved' || c.status === 'Fix Verified').length;
  
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-200">
               <LayoutDashboard className="w-5 h-5 text-indigo-700" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-slate-900">Civic Operations Console</h1>
               <p className="text-sm text-slate-500">Demo overview of priority issues and community verification signals.</p>
             </div>
          </div>
          <div className="hidden md:flex text-sm text-slate-500 items-center gap-2">
             <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
             </span>
             System Online
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="shadow-sm border-slate-200">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgent Cases</span>
               <AlertCircle className="w-4 h-4 text-red-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900">{urgentCases.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-slate-200">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review packets ready</span>
               <TrendingUp className="w-4 h-4 text-blue-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900">{readyCases.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-slate-200">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duplicate Fusion</span>
               <Layers className="w-4 h-4 text-amber-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900">{duplicateRiskCases.length}</span>
           </CardContent>
         </Card>
         <Card className="shadow-sm border-slate-200">
           <CardContent className="p-4 md:p-5 flex flex-col gap-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Resolved</span>
               <CheckCircle2 className="w-4 h-4 text-green-500" />
             </div>
             <span className="text-2xl md:text-3xl font-bold text-slate-900">{resolvedCount}</span>
           </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Urgent Queue */}
         <section className="flex flex-col gap-4">
           <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
             Action Required <Badge className="bg-red-100 text-red-800 border-red-200">{urgentCases.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {urgentCases.slice(0, 5).map(c => (
                <div key={c.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col gap-2 cursor-pointer hover:border-slate-300 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[150px]">{c.category}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border shrink-0 ${getSeverityColor(c.severity)}`}>Sev {c.severity}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 leading-snug">{c.title}</h3>
                  <div className="text-xs font-medium text-slate-500 mt-1 flex justify-between items-center">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/> {c.verificationCount} verifications</span>
                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{c.age}</span>
                  </div>
                </div>
             ))}
             {urgentCases.length === 0 && (
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                  No urgent cases currently.
               </div>
             )}
           </div>
         </section>

         {/* Authority Ready */}
         <section className="flex flex-col gap-4">
           <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
             Prepared Packets <Badge className="bg-blue-100 text-blue-800 border-blue-200">{readyCases.length}</Badge>
           </h2>
           <div className="flex flex-col gap-3">
             {readyCases.slice(0, 5).map(c => (
                <div key={c.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col gap-2 cursor-pointer hover:border-slate-300 transition-colors" onClick={() => navigate(`/escalation/${c.id}`)}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[180px]">{c.suggestedDepartment}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded shrink-0">Prepared</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 leading-snug">{c.title}</h3>
                  <div className="text-xs font-medium text-slate-500 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> Verified by {c.verificationCount} citizens</span>
                    <span className="text-blue-600 font-semibold hover:underline">Review Packet &rarr;</span>
                  </div>
                </div>
             ))}
             {readyCases.length === 0 && (
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                 No prepared packets currently.
               </div>
             )}
           </div>
         </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Duplicate Fusion Review */}
         <section className="flex flex-col gap-4 lg:col-span-2">
           <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
             Duplicate Fusion Review <Badge className="bg-amber-100 text-amber-800 border-amber-200">{duplicateRiskCases.length}</Badge>
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {duplicateRiskCases.map(c => (
                <div key={c.id} className="bg-white border-2 border-amber-200 p-4 rounded-xl shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-1 rounded flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> High Duplicate Risk</span>
                  </div>
                  <h3 className="font-bold text-slate-900">{c.title}</h3>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2">
                    <div className="text-xs text-slate-600">
                      <strong>Issue DNA Match:</strong> Similar description and same geo-bucket as existing cases.
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Recommendation:</strong> Merge evidence or verify separately.
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white py-2 rounded shadow-sm hover:bg-slate-800 transition-colors" onClick={() => navigate(`/case/${c.id}`)}>Review</button>
                    <button className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 py-2 rounded border border-blue-200 hover:bg-blue-200 transition-colors">Merge</button>
                    <button className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 py-2 rounded border border-slate-200 hover:bg-slate-200 transition-colors">Keep Sep.</button>
                  </div>
                </div>
             ))}
             {duplicateRiskCases.length === 0 && (
               <div className="col-span-1 md:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                 No duplicate fusion cases to review.
               </div>
             )}
           </div>
         </section>
      </div>
    </div>
  )
}
