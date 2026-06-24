import { useParams, useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProofLadder } from '../components/shared/ProofLadder';
import { MapPin, Clock, ShieldCheck, ArrowLeft, Image as ImageIcon, AlertTriangle, Layers } from 'lucide-react';
import { getSeverityColor } from '../components/shared/CaseCard';
import { Badge } from '../components/ui/Badge';
import { useState } from 'react';

export function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, userRole, verifyCase } = useDemo();
  const [showFusionModal, setShowFusionModal] = useState(false);
  
  const caseItem = cases.find(c => c.id === id);

  if (!caseItem) {
    return <div className="p-8 text-center text-slate-500">Case not found.</div>
  }

  const isResolved = caseItem.status === 'Resolved' || caseItem.status === 'Fix Verified';

  const handleDuplicateMark = () => {
    verifyCase(caseItem.id, 'duplicate');
    setShowFusionModal(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      <Button variant="ghost" className="w-fit -ml-4 text-slate-500 gap-2 hover:bg-slate-100" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {showFusionModal && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800 items-start shadow-sm">
          <Layers className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="flex flex-col gap-1">
            <h4 className="font-bold">Marked for Fusion</h4>
            <p className="text-sm">You flagged this as a duplicate. It has been grouped with similar reports to prioritize municipal response and prevent map clutter. (+8 Trust Awarded)</p>
            <Button variant="outline" size="sm" className="w-fit mt-2 bg-white text-blue-700" onClick={() => setShowFusionModal(false)}>Dismiss</Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Column: Details */}
        <div className="w-full md:w-3/5 flex flex-col gap-6">
           <div>
             <div className="flex flex-wrap gap-2 mb-3">
               <Badge className="bg-slate-100 text-slate-800 border-slate-200 font-semibold">{caseItem.category}</Badge>
               <div className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold border ${getSeverityColor(caseItem.severity)}`}>
                 Severity {caseItem.severity}
               </div>
               {caseItem.duplicateRisk === 'High' && (
                 <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-200 uppercase tracking-wider text-[10px] font-bold">High Duplicate Risk</Badge>
               )}
             </div>
             <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{caseItem.title}</h1>
           </div>

           <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-600">
             <div className="flex items-center gap-1.5">
               <MapPin className="w-4 h-4 shrink-0 text-blue-600" />
               <span className="font-medium text-slate-700">{caseItem.locationLabel}</span>
             </div>
             <div className="hidden sm:block text-slate-300">•</div>
             <div className="flex items-center gap-1.5">
               <Clock className="w-4 h-4 shrink-0" />
               <span>Reported {caseItem.age}</span>
             </div>
           </div>
           
           {/* Evidence Placeholder */}
           <div className="w-full h-56 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden group">
             {caseItem.imagePlaceholder ? (
               <img src={caseItem.imagePlaceholder} alt="Civic Issue" className="w-full h-full object-cover" />
             ) : (
               <>
                 <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                 <span className="text-xs font-medium uppercase tracking-wider">Evidence Photo</span>
               </>
             )}
             <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-white flex items-center gap-1 shadow-sm">
                Source: {caseItem.locationSource}
             </div>
           </div>

           {/* AI Summary Panel */}
           <Card className="bg-slate-50 border-slate-200 shadow-sm">
             <CardContent className="p-5 flex gap-4 items-start">
               <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg shrink-0 mt-0.5">
                 <ShieldCheck className="w-5 h-5" />
               </div>
               <div className="w-full">
                 <h3 className="text-sm font-bold text-slate-900 mb-1">Diagnostic Summary</h3>
                 <p className="text-sm text-slate-700 leading-relaxed">{caseItem.aiSummary}</p>
                 <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                   <div>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assigned Dept</span>
                     <span className="text-sm font-medium text-slate-900">{caseItem.suggestedDepartment}</span>
                   </div>
                   <div>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Evidence Quality</span>
                     <span className="text-sm font-medium text-slate-900">{caseItem.evidenceQuality}</span>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Actions based on role */}
           <div className="flex flex-col sm:flex-row gap-3 pt-2">
             {userRole === 'citizen' && !caseItem.verifiedByMe && !isResolved && (
               <>
                 <Button size="lg" className="w-full sm:w-auto font-semibold" onClick={() => verifyCase(caseItem.id, 'verify')}>
                   Verify still exists (+5)
                 </Button>
                 <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white font-semibold text-slate-700" onClick={handleDuplicateMark}>
                   Mark duplicate (+8)
                 </Button>
               </>
             )}
             {userRole === 'citizen' && caseItem.status === 'Resolved' && !caseItem.verifiedByMe && (
               <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={() => verifyCase(caseItem.id, 'fixed')}>
                 Confirm Fixed (+12 Trust)
               </Button>
             )}
             {userRole === 'citizen' && caseItem.verifiedByMe && (
               <Button size="lg" variant="secondary" disabled className="w-full sm:w-auto font-semibold bg-slate-100 text-slate-500">
                 <CheckCircle2 className="w-4 h-4 mr-2" /> Action Recorded
               </Button>
             )}
             
             {userRole === 'admin' && (
               <Button size="lg" className="w-full sm:w-auto font-semibold" onClick={() => navigate(`/escalation/${caseItem.id}`)}>
                 Generate Escalation Packet
               </Button>
             )}
           </div>
        </div>

        {/* Right Column: Ladder */}
        <div className="w-full md:w-2/5 md:pl-4">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-5 md:p-6">
              <h3 className="font-bold text-slate-900 mb-6">Proof Ladder</h3>
              <ProofLadder currentStage={caseItem.proofLadderStage} />
              
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Next Best Action</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-700 font-medium">{caseItem.nextBestAction}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Community Trust</h4>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(5, caseItem.verificationCount || 1))].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        ?
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {caseItem.verificationCount} verifications
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Ensure CheckCircle2 is imported
import { CheckCircle2 } from 'lucide-react';

