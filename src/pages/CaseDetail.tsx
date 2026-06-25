import { useParams, useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { ProofLadder } from '../components/shared/ProofLadder';
import { MapPin, Clock, ShieldCheck, ArrowLeft, Image as ImageIcon, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import { getSeverityColor } from '../components/shared/CaseCard';
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

  let nextBestAction = caseItem.nextBestAction;
  if (!caseItem.verifiedByMe) {
    if (caseItem.duplicateRisk === 'High') {
      nextBestAction = 'confirm duplicate';
    } else if (caseItem.locationSource === 'Manual pin') {
      nextBestAction = 'verify location';
    } else if (caseItem.evidenceQuality === 'Low') {
      nextBestAction = 'add clearer photo';
    } else if (caseItem.status === 'Resolved') {
      nextBestAction = 'mark fix verified';
    }
  } else {
    if (caseItem.status === 'Authority Ready') {
      nextBestAction = 'wait for reviewer packet';
    } else if (caseItem.status === 'Escalated') {
      nextBestAction = 'wait for resolution';
    }
  }
  if (userRole === 'admin' && caseItem.status === 'Authority Ready') {
    nextBestAction = 'review prepared packet';
  }

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-28 md:pb-10 relative">
      <header className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
            {caseItem.category}
          </span>
          <h1 className="text-sm font-bold text-slate-900 truncate">
            {caseItem.title}
          </h1>
        </div>
      </header>

      <div className="flex flex-col md:flex-row max-w-5xl mx-auto w-full">
        {/* Left Column: Details */}
        <div className="w-full md:w-3/5 flex flex-col">
           
           {/* Evidence Photo Banner */}
           <div className="w-full h-56 md:h-72 bg-slate-200 relative flex flex-col items-center justify-center text-slate-400 overflow-hidden">
             {caseItem.imagePlaceholder ? (
               <img src={caseItem.imagePlaceholder} alt="Civic Issue" className="w-full h-full object-cover" />
             ) : (
               <>
                 <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
               </>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
             
             <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
               <div className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border shadow-sm ${getSeverityColor(caseItem.severity)}`}>
                 Severity {caseItem.severity}
               </div>
               <div className="bg-white/90 backdrop-blur-sm text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white flex items-center gap-1 shadow-sm">
                 Source: {caseItem.locationSource}
               </div>
             </div>
           </div>

           <div className="p-4 flex flex-col gap-5 bg-white border-b border-slate-200">
             
             {showFusionModal && (
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-3 text-blue-800 items-start shadow-sm mb-2">
                 <Layers className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                 <div className="flex flex-col gap-1">
                   <h4 className="font-bold text-sm">Marked for Fusion</h4>
                   <p className="text-xs">Flagged as duplicate. It will be grouped with similar reports. (+8 Trust Awarded)</p>
                   <button className="text-xs font-bold text-blue-700 underline mt-1 text-left w-fit" onClick={() => setShowFusionModal(false)}>Dismiss</button>
                 </div>
               </div>
             )}

             <div className="flex flex-col gap-1">
               <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{caseItem.title}</h1>
               <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                 <div className="flex items-center gap-1">
                   <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                   <span className="truncate">{caseItem.locationLabel}</span>
                 </div>
                 <span>-</span>
                 <span className="whitespace-nowrap">{caseItem.age}</span>
               </div>
             </div>

             {/* Case Intelligence */}
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-4">
               <div className="flex items-center gap-2 mb-1">
                 <ShieldCheck className="w-4 h-4 text-blue-600" />
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Case Intelligence</h3>
               </div>
               
               <div className="flex flex-col gap-2">
                 <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                   <strong>AI Summary:</strong> {caseItem.aiSummary}
                 </p>
                 
                 <div className="grid grid-cols-2 gap-2 mt-2">
                   <div className="bg-white p-2 rounded border border-slate-200">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Evidence Quality</span>
                     <span className="text-xs font-bold text-slate-900">{caseItem.evidenceQuality}</span>
                   </div>
                   <div className="bg-white p-2 rounded border border-slate-200">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Location Confidence</span>
                     <span className="text-xs font-bold text-slate-900">{caseItem.locationSource === 'Manual pin' ? 'Low' : 'High'}</span>
                   </div>
                 </div>

                 {caseItem.duplicateRisk === 'High' && (
                   <div className="flex items-start gap-2 text-xs font-medium text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                     <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                     <div className="flex flex-col gap-1">
                       <strong className="uppercase tracking-wider font-bold text-[10px] text-amber-700">Duplicate Risk: High</strong>
                       <span>Issue DNA matches existing cases in this geo-bucket. Verification needed to confirm status.</span>
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </div>

           {/* Proof Ladder - Mobile view inline */}
           <div className="p-4 bg-white border-b border-slate-200 md:hidden">
             <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">Proof Ladder</h3>
             <ProofLadder currentStage={caseItem.proofLadderStage} />
             
             <div className="mt-6 pt-5 border-t border-slate-100">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Next Best Action</h4>
               <p className="text-sm text-slate-800 font-semibold">{nextBestAction}</p>
             </div>
             
             <div className="mt-5 pt-5 border-t border-slate-100">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Community Trust</h4>
               <div className="flex items-center gap-2">
                 <div className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded text-xs border border-slate-200">
                   {caseItem.verificationCount} verifications
                 </div>
               </div>
             </div>
           </div>

        </div>

        {/* Right Column: Ladder (Desktop only) */}
        <div className="hidden md:block w-full md:w-2/5 md:p-6 md:border-l border-slate-200">
           <h3 className="font-bold text-slate-900 mb-6">Proof Ladder</h3>
           <ProofLadder currentStage={caseItem.proofLadderStage} />
           
           <div className="mt-8 pt-6 border-t border-slate-200">
             <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Next Best Action</h4>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
               <p className="text-sm text-slate-700 font-medium">{nextBestAction}</p>
             </div>
           </div>
           
           <div className="mt-6 pt-6 border-t border-slate-200">
             <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Community Trust</h4>
             <div className="flex items-center gap-3">
               <div className="flex -space-x-2">
                 {[...Array(Math.min(5, caseItem.verificationCount || 1))].map((_, i) => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                     +
                   </div>
                 ))}
               </div>
               <div className="text-sm font-medium text-slate-700">
                 {caseItem.verificationCount} verifications
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 w-full max-w-[430px] md:max-w-none md:sticky md:bottom-0 bg-white border-t border-slate-200 p-3 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-20 flex gap-2">
        {userRole === 'citizen' && !caseItem.verifiedByMe && !isResolved && (
          <>
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-colors" onClick={() => verifyCase(caseItem.id, 'verify')}>
              Verify Issue (+5)
            </button>
            <button className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold text-sm py-3 rounded-xl shadow-sm hover:bg-slate-50 transition-colors" onClick={handleDuplicateMark}>
              Duplicate (+8)
            </button>
          </>
        )}
        {userRole === 'citizen' && caseItem.status === 'Resolved' && !caseItem.verifiedByMe && (
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-colors" onClick={() => verifyCase(caseItem.id, 'fixed')}>
            Confirm Fixed (+12 Trust)
          </button>
        )}
        {userRole === 'citizen' && caseItem.verifiedByMe && (
          <button disabled className="w-full bg-slate-100 text-slate-500 font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Action Recorded
          </button>
        )}
        
        {userRole === 'admin' && (
          <button className="w-full bg-slate-900 text-white font-bold text-sm py-3 rounded-xl shadow-sm hover:bg-slate-800 transition-colors" onClick={() => navigate(`/escalation/${caseItem.id}`)}>
            Review Packet
          </button>
        )}
      </div>

    </div>
  )
}

