import { useParams, useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, ArrowLeft, Download, ShieldAlert, CheckCircle2, Building, Printer, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { getSeverityColor } from '../components/shared/CaseCard';
import { ContextualEnrichment } from '../components/shared/ContextualEnrichment';

export function EscalationPacket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases } = useDemo();
  
  const caseItem = cases.find(c => c.id === id);

  if (!caseItem) {
    return <div className="p-8 text-center text-slate-500">Case not found.</div>
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Button variant="ghost" className="w-fit -ml-4 text-slate-500 gap-2 hover:bg-slate-100" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back to Case
      </Button>

      <div className="flex items-center gap-4">
         <div className="w-14 h-14 rounded-full bg-[#0f284b] dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm dark:border dark:border-slate-700">
           <FileText className="w-6 h-6 text-white dark:text-blue-400" />
         </div>
         <div>
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Authority Escalation Packet</h1>
           <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Auto-generated summary for {caseItem.suggestedDepartment}</p>
         </div>
      </div>

      <Card className="border border-[#e2e8f0] dark:border-slate-700 rounded-[24px] shadow-sm overflow-hidden bg-white dark:bg-slate-800">
        <div className="bg-[#f8f9fc] dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-700 px-6 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Case Reference: #{caseItem.id.toUpperCase()}</div>
          </div>
          <Badge className="bg-blue-50 dark:bg-blue-900/30 text-[#0f284b] dark:text-blue-400 border-blue-100 dark:border-blue-800/30 w-fit font-bold uppercase tracking-wider text-[10px] px-3 py-1 rounded-full">Prepared for review</Badge>
        </div>
        <CardContent className="p-6 md:p-8 flex flex-col gap-8">
           <div>
             <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{caseItem.title}</h2>
             <div className="flex flex-wrap gap-2 text-sm">
               <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full border border-[#e2e8f0] dark:border-slate-600 text-[10px] uppercase tracking-wider">{caseItem.category}</span>
               <span className={`font-bold px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-wider ${getSeverityColor(caseItem.severity)}`}>Severity {caseItem.severity}</span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#e2e8f0] dark:border-slate-700">
             <div>
               <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Location Data</h3>
               <p className="text-slate-900 dark:text-white font-bold">{caseItem.locationLabel}</p>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Confidence: {caseItem.locationSource === 'Manual pin' ? 'Low' : 'High'} ({caseItem.locationSource})</p>
             </div>
             <div>
               <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Verification Proof</h3>
               <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                 <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                 Verified by {caseItem.verificationCount} unique citizens
               </div>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Evidence Quality: {caseItem.evidenceQuality}</p>
             </div>
           </div>

           <div className="pt-6 border-t border-[#e2e8f0] dark:border-slate-700">
             <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Case Analytics</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-[#f8f9fc] dark:bg-slate-900 p-4 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700">
                 <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Issue DNA Summary</h4>
                 <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{caseItem.category} - Severity {caseItem.severity}</p>
               </div>
               <div className="bg-[#f8f9fc] dark:bg-slate-900 p-4 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700">
                 <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Duplicate Risk & Decision</h4>
                 <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{caseItem.duplicateRisk === 'Low' ? 'Low Risk - Confirmed Unique' : 'High Risk - Fusion Pending'}</p>
               </div>
               <div className="bg-[#f8f9fc] dark:bg-slate-900 p-4 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700">
                 <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Evidence Ledger Summary</h4>
                 <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{(caseItem.evidenceLedger?.length || 0) + 2} recorded events</p>
               </div>
               <div className="bg-[#f8f9fc] dark:bg-slate-900 p-4 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700">
                 <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Missing Information</h4>
                 <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{caseItem.evidenceQuality === 'Low' ? 'Clearer photo needed' : caseItem.locationSource === 'Manual pin' ? 'Exact GPS needed' : 'None'}</p>
               </div>
             </div>
           </div>

           <div className="pt-6 border-t border-[#e2e8f0] dark:border-slate-700">
             <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">AI Diagnostic Summary</h3>
             <div className="bg-[#f8f9fc] dark:bg-slate-900 p-5 rounded-[20px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm flex flex-col gap-4 mb-4">
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium text-sm">{caseItem.aiSummary}</p>
                {caseItem.aiObjectiveDescription && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> De-Escalated Description
                    </span>
                    <p className="text-[#0f284b] leading-relaxed font-medium text-sm">{caseItem.aiObjectiveDescription}</p>
                  </div>
                )}
             </div>
             
             <ContextualEnrichment 
               category={caseItem.category} 
               title={caseItem.title} 
               lat={caseItem.lat} 
               lng={caseItem.lng} 
             />
           </div>

           <div className="pt-6 border-t border-[#e2e8f0]">
             <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Recommended Reviewer Action</h3>
             <div className="flex items-start gap-3 bg-red-50/50 p-5 rounded-[20px] border border-red-100 text-red-900">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
                <p className="font-bold text-sm leading-relaxed">Dispatch field repair crew and update status.</p>
             </div>
           </div>
        </CardContent>
        <div className="bg-[#f8f9fc] px-6 py-5 border-t border-[#e2e8f0] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
           <span>Prepared by CivicPulse AI</span>
           <span>Timestamp: {new Date().toLocaleDateString()}</span>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 rounded-[24px] border border-[#e2e8f0] shadow-sm mb-6">
        <p className="text-sm font-medium text-slate-700 max-w-md leading-relaxed">
          Prepared for review. Not automatically submitted to a real authority.
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto gap-2 bg-white text-slate-700 rounded-full border-[#e2e8f0] font-bold">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button className="w-full sm:w-auto gap-2 shrink-0 font-bold bg-[#0f284b] hover:bg-[#1a365d] rounded-full">
            <Download className="w-4 h-4" /> Export Packet
          </Button>
        </div>
      </div>
    </div>
  )
}
