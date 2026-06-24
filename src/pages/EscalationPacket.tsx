import { useParams, useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, ArrowLeft, Download, ShieldAlert, CheckCircle2, Building, Printer } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { getSeverityColor } from '../components/shared/CaseCard';

export function EscalationPacket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases } = useDemo();
  
  const caseItem = cases.find(c => c.id === id);

  if (!caseItem) {
    return <div className="p-8 text-center text-slate-500">Case not found.</div>
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <Button variant="ghost" className="w-fit -ml-4 text-slate-500 gap-2 hover:bg-slate-100" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back to Case
      </Button>

      <div className="flex items-center gap-4">
         <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
           <FileText className="w-6 h-6 text-white" />
         </div>
         <div>
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Authority Escalation Packet</h1>
           <p className="text-sm text-slate-500 font-medium">Auto-generated summary for {caseItem.suggestedDepartment}</p>
         </div>
      </div>

      <Card className="border-2 border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Case Reference: #{caseItem.id.toUpperCase()}</div>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 w-fit font-semibold uppercase tracking-wider text-[10px]">Prepared for review</Badge>
        </div>
        <CardContent className="p-6 md:p-8 flex flex-col gap-8">
           <div>
             <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">{caseItem.title}</h2>
             <div className="flex flex-wrap gap-2 text-sm">
               <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[11px] uppercase tracking-wider">{caseItem.category}</span>
               <span className={`font-bold px-2 py-1 rounded border text-[11px] uppercase tracking-wider ${getSeverityColor(caseItem.severity)}`}>Severity {caseItem.severity}</span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
             <div>
               <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Location Data</h3>
               <p className="text-slate-900 font-semibold">{caseItem.locationLabel}</p>
               <p className="text-xs font-medium text-slate-500 mt-1">Source: {caseItem.locationSource}</p>
             </div>
             <div>
               <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Verification Proof</h3>
               <div className="flex items-center gap-2 text-slate-900 font-semibold">
                 <CheckCircle2 className="w-4 h-4 text-green-600" />
                 Verified by {caseItem.verificationCount} unique citizens
               </div>
               <p className="text-xs font-medium text-slate-500 mt-1">Evidence Quality: {caseItem.evidenceQuality}</p>
             </div>
           </div>

           <div className="pt-6 border-t border-slate-100">
             <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">AI Diagnostic Summary</h3>
             <div className="bg-slate-50 p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-slate-800 leading-relaxed font-medium text-sm">{caseItem.aiSummary}</p>
             </div>
           </div>

           <div className="pt-6 border-t border-slate-100">
             <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Recommended Action</h3>
             <div className="flex items-start gap-3 bg-red-50/50 p-4 md:p-5 rounded-lg border border-red-100 text-red-900">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
                <p className="font-semibold text-sm leading-relaxed">{caseItem.nextBestAction}</p>
             </div>
           </div>
        </CardContent>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
           <span>Prepared by CivicPulse AI</span>
           <span>Timestamp: {new Date().toLocaleDateString()}</span>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
          <strong>Demo Notice:</strong> Prepared for review. Not automatically submitted to a real authority.
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto gap-2 bg-white text-slate-700">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button className="w-full sm:w-auto gap-2 shrink-0 font-semibold">
            <Download className="w-4 h-4" /> Export Packet
          </Button>
        </div>
      </div>
    </div>
  )
}
