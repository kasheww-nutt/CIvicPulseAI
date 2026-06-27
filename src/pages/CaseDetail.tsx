import { useParams, useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { ProofLadder } from '../components/shared/ProofLadder';
import { BeforeAfterSlider } from '../components/shared/BeforeAfterSlider';
import { ContextualEnrichment } from '../components/shared/ContextualEnrichment';
import { Sparkles, MapPin, Clock, ShieldCheck, ArrowLeft, Image as ImageIcon, AlertTriangle, Layers, CheckCircle2, History, Wallet } from 'lucide-react';
import { getSeverityColor } from '../components/shared/CaseCard';
import { useState } from 'react';
import { getNextBestAction, getEvidenceLedger, canVerify, canPreparePacket, canVerifyFix, getLifecycleStage } from '../lib/caseLifecycle';
import { motion } from 'motion/react';

export function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, userRole, verifyCase, preparePacket, claimRepair, attachEvidence, trustScore } = useDemo();
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  
  const caseItem = cases.find(c => c.id === id);

  if (!caseItem) {
    return <div className="p-8 text-center text-slate-500">Case not found.</div>
  }

  const handleDuplicateMark = () => {
    verifyCase(caseItem.id, 'duplicate');
    setShowFusionModal(true);
  };

  let nextBestAction = getNextBestAction(caseItem);
  const ledger = getEvidenceLedger(caseItem);
  const stage = getLifecycleStage(caseItem);
  const isClosed = stage === 'Closed' || stage === 'Fix verified';

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-transparent min-h-screen pb-28 lg:pb-0 relative">
      <header className="bg-white dark:bg-slate-900 px-6 pt-6 pb-4 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {caseItem.category}
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight">
            {caseItem.title}
          </h1>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-6 lg:px-8 pt-6 gap-6">
        {/* Left Column: Details */}
        <div className="w-full lg:w-3/5 flex flex-col gap-6">
           
           {/* Evidence Photo Banner */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.4 }}
             className="w-full h-56 lg:h-72 bg-slate-200 relative flex flex-col items-center justify-center text-slate-400 overflow-hidden rounded-[24px] shadow-sm border border-[#e2e8f0]"
           >
             {(isClosed && caseItem.fixedImagePlaceholder) ? (
               <BeforeAfterSlider 
                 beforeImage={caseItem.imagePlaceholder || ''} 
                 afterImage={caseItem.fixedImagePlaceholder} 
               />
             ) : caseItem.imagePlaceholder ? (
               <img src={caseItem.imagePlaceholder} alt="Civic Issue" className="w-full h-full object-cover" />
             ) : (
               <>
                 <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
               </>
             )}
             
             {!isClosed && <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />}
             
             <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
               <div className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold border shadow-sm pointer-events-auto ${getSeverityColor(caseItem.severity)}`}>
                 Severity {caseItem.severity}
               </div>
               <div className="bg-white/90 backdrop-blur-md text-slate-800 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#e2e8f0] flex items-center gap-1.5 shadow-sm pointer-events-auto">
                 Source: {caseItem.locationSource}
               </div>
             </div>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.4, delay: 0.1 }}
             className="flex flex-col gap-6"
           >
             
             {showFusionModal && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 flex gap-3 text-amber-900 items-start shadow-sm"
               >
                 <Layers className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                 <div className="flex flex-col gap-1.5">
                   <h4 className="font-bold text-sm">Marked for Fusion</h4>
                   <p className="text-xs font-medium">Flagged as duplicate. It will be grouped with similar reports. (+8 Trust Awarded)</p>
                   <button className="text-xs font-bold text-amber-700 underline mt-1 text-left w-fit" onClick={() => setShowFusionModal(false)}>Dismiss</button>
                 </div>
               </motion.div>
             )}

             <div className="flex flex-col gap-2">
               {/* Bounty Banner */}
               {caseItem.bounty && !isClosed && (
                 <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-[24px] shadow-sm text-white flex flex-col relative overflow-hidden mb-2">
                   <div className="absolute -right-4 -bottom-4 opacity-20">
                     <Wallet className="w-24 h-24" />
                   </div>
                   <div className="relative z-10 flex flex-col gap-1">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 bg-white/20 px-2 py-0.5 rounded-full w-fit">Community Bounty</span>
                     <div className="text-3xl font-black mt-1">${caseItem.bounty.amount.toFixed(2)}</div>
                     <p className="text-[11px] font-medium text-emerald-50 mt-1">Sponsored by <strong>{caseItem.bounty.sponsor}</strong>. Earn 50% by verifying.</p>
                   </div>
                 </div>
               )}

               <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight tracking-tight">{caseItem.title}</h1>
               <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                 <div className="flex items-center gap-1.5">
                   <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                   <span className="truncate">{caseItem.locationLabel}</span>
                 </div>
                 <span>-</span>
                 <span className="whitespace-nowrap bg-slate-100 px-2 py-1 rounded-full">{caseItem.age}</span>
               </div>
             </div>

             {/* Case Intelligence */}
             <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 flex flex-col gap-4 shadow-sm">
               <div className="flex items-center gap-2 mb-1">
                 <ShieldCheck className="w-5 h-5 text-[#0f284b]" />
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Case Intelligence</h3>
               </div>
               
               <div className="flex flex-col gap-3">
                 <p className="text-sm text-slate-700 leading-relaxed font-medium bg-[#f8f9fc] p-4 rounded-[20px] border border-[#e2e8f0]">
                   <strong className="text-slate-900 block mb-1">AI Summary:</strong> {caseItem.aiSummary}
                 </p>
                 
                 {caseItem.aiAdditionalSummary && (
                   <p className="text-sm text-slate-700 leading-relaxed font-medium bg-amber-50/50 p-4 rounded-[20px] border border-amber-100">
                     <strong className="text-amber-800 flex items-center gap-1 mb-1">
                       <ImageIcon className="w-4 h-4" /> Visual Evidence Summary:
                     </strong>
                     {caseItem.aiAdditionalSummary}
                   </p>
                 )}
                 
                 {caseItem.aiObjectiveDescription && (
                   <p className="text-sm text-[#0f284b] leading-relaxed font-medium bg-blue-50/50 p-4 rounded-[20px] border border-blue-100">
                     <strong className="text-[#0f284b] flex items-center gap-1 mb-1">
                       <Sparkles className="w-4 h-4" /> De-Escalated Description:
                     </strong> 
                     {caseItem.aiObjectiveDescription}
                   </p>
                 )}
                 
                 <div className="grid grid-cols-2 gap-3 mt-1">
                   <div className="bg-[#f8f9fc] p-3 rounded-[20px] border border-[#e2e8f0]">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Evidence Quality</span>
                     <span className="text-sm font-bold text-slate-900">{caseItem.evidenceQuality}</span>
                   </div>
                   <div className="bg-[#f8f9fc] p-3 rounded-[20px] border border-[#e2e8f0]">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Location Confidence</span>
                     <span className="text-sm font-bold text-slate-900">{caseItem.locationSource === 'Manual pin' ? 'Low' : 'High'}</span>
                   </div>
                 </div>

                 {caseItem.duplicateRisk === 'High' && (
                   <div className="flex items-start gap-2.5 text-xs font-medium text-amber-800 bg-amber-50 p-4 rounded-[20px] border border-amber-200 mt-2">
                     <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                     <div className="flex flex-col gap-1.5">
                       <strong className="uppercase tracking-wider font-bold text-[10px] text-amber-700">Duplicate Risk: High</strong>
                       <span>Issue DNA matches existing cases in this geo-bucket. Verification needed to confirm status.</span>
                     </div>
                   </div>
                 )}
                  <ContextualEnrichment 
                    category={caseItem.category} 
                    title={caseItem.title} 
                    lat={caseItem.lat} 
                    lng={caseItem.lng} 
                  />
               </div>
             </div>

             {/* Evidence Ledger */}
             <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm flex flex-col gap-4">
               <div className="flex items-center gap-2 mb-1">
                 <History className="w-5 h-5 text-slate-500" />
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Evidence Ledger</h3>
               </div>
               <div className="flex flex-col gap-4 relative pl-4 mt-2">
                 <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#e2e8f0] -z-10" />
                 {ledger.map((item, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.2 + (i * 0.1) }}
                     key={item.id || i} 
                     className="flex gap-4"
                   >
                     <div className="w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white shrink-0 mt-1" />
                     <div className="flex flex-col flex-1 pb-2">
                       <div className="flex justify-between items-start gap-2">
                         <span className="text-sm font-bold text-slate-900">{item.title}</span>
                         <span className="text-[10px] text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-full font-medium">{item.timestamp}</span>
                       </div>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] bg-[#f8f9fc] border border-[#e2e8f0] text-slate-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">{item.sourceType}</span>
                         {item.trustImpact > 0 && (
                           <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full">+{item.trustImpact} Trust</span>
                         )}
                       </div>
                       <p className="text-xs text-slate-600 mt-2 font-medium">{item.explanation}</p>
                     </div>
                   </motion.div>
                 ))}
               </div>
             </div>
           </motion.div>

           {/* Proof Ladder - Mobile view inline */}
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.4, delay: 0.2 }}
             className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm lg:hidden"
           >
             <h3 className="text-sm font-bold text-slate-900 mb-5 uppercase tracking-wider flex items-center gap-2">Proof Ladder</h3>
             <ProofLadder caseItem={caseItem} />
             
             <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Next Best Action</h4>
               <p className="text-sm text-slate-800 font-bold">{nextBestAction}</p>
             </div>
             
             <div className="mt-5 pt-5 border-t border-[#e2e8f0]">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Community Trust</h4>
               <div className="flex items-center gap-2">
                 <div className="bg-[#f8f9fc] text-[#0f284b] font-bold px-3 py-1.5 rounded-full text-xs border border-[#e2e8f0]">
                   {caseItem.verificationCount} verifications
                 </div>
               </div>
             </div>
           </motion.div>

        </div>

        {/* Right Column: Ladder (Desktop only) */}
        <div className="hidden lg:flex w-full lg:w-2/5 flex-col gap-6">
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.4, delay: 0.2 }}
             className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm sticky top-24"
           >
             <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Proof Ladder</h3>
             <ProofLadder caseItem={caseItem} />
             
             <div className="mt-8 pt-6 border-t border-[#e2e8f0]">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Next Best Action</h4>
               <div className="bg-[#f8f9fc] p-4 rounded-[20px] border border-[#e2e8f0]">
                 <p className="text-sm text-slate-800 font-bold">{nextBestAction}</p>
               </div>
             </div>
             
             <div className="mt-6 pt-6 border-t border-[#e2e8f0]">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Community Trust</h4>
               <div className="flex items-center gap-3">
                 <div className="flex -space-x-2">
                   {[...Array(Math.min(5, caseItem.verificationCount || 1))].map((_, i) => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                       +
                     </div>
                   ))}
                 </div>
                 <div className="text-sm font-bold text-slate-800">
                   {caseItem.verificationCount} verifications
                 </div>
               </div>
             </div>
           </motion.div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto w-full lg:max-w-none lg:sticky lg:bottom-0 bg-white dark:bg-slate-900 border-t border-[#e2e8f0] dark:border-slate-800 p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-none z-20 flex flex-col gap-3"
      >
        {userRole === 'citizen' && !isClosed && (
          <>
            {/* Area Warden (500+ Trust) Superpowers */}
            {trustScore >= 500 && stage !== 'Fix verification needed' && !caseItem.verifiedByMe && (
              <div className="flex gap-2">
                <button 
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] py-3 rounded-xl shadow-sm transition-colors flex flex-col items-center justify-center leading-tight"
                  onClick={() => verifyCase(caseItem.id, 'warden_duplicate')}
                >
                  <span className="opacity-80 font-medium">Warden Override</span>
                  Mark Duplicate
                </button>
                <button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-3 rounded-xl shadow-sm transition-colors flex flex-col items-center justify-center leading-tight"
                  onClick={() => verifyCase(caseItem.id, 'warden_resolve')}
                >
                  <span className="opacity-80 font-medium">Warden Override</span>
                  Mark Resolved
                </button>
              </div>
            )}

            {/* Standard Verifications (Require 100+ Trust) */}
            {canVerify(caseItem) && trustScore >= 100 && (
              <button className="w-full bg-[#0f284b] hover:bg-[#1a365d] text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors" onClick={() => verifyCase(caseItem.id, 'verify')}>
                Verify Issue (+5)
              </button>
            )}
            {canVerify(caseItem) && trustScore < 100 && (
              <button disabled className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm py-4 rounded-full shadow-sm">
                Need 100 Trust to Verify
              </button>
            )}
            {canVerify(caseItem) && caseItem.duplicateRisk === 'High' && trustScore >= 100 && (
              <button className="w-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm py-4 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={handleDuplicateMark}>
                Confirm Duplicate (+8)
              </button>
            )}
            {canVerify(caseItem) && caseItem.locationSource === 'Manual pin' && trustScore >= 100 && (
              <button className="w-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm py-4 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => verifyCase(caseItem.id, 'location')}>
                Confirm Location (+5)
              </button>
            )}
            {canVerify(caseItem) && caseItem.evidenceQuality === 'Low' && trustScore >= 100 && (
              <button className="w-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm py-4 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => attachEvidence(caseItem.id, 'High')}>
                Add Clearer Photo (+8)
              </button>
            )}
            {canVerifyFix(caseItem) && trustScore >= 100 && (
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors" onClick={() => verifyCase(caseItem.id, 'fixed')}>
                Verify Fix (+12 Trust)
              </button>
            )}
            {stage === 'Community verified' && (
              <button className="w-full bg-[#0f284b] hover:bg-[#1a365d] text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors" onClick={() => preparePacket(caseItem.id)}>
                Prepare Reviewer Packet
              </button>
            )}
            {caseItem.verifiedByMe && !canVerifyFix(caseItem) && stage !== 'Community verified' && (
              <button disabled className="w-full bg-slate-100 text-slate-500 font-bold text-sm py-4 rounded-full flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Action Recorded
              </button>
            )}
          </>
        )}
        {userRole === 'citizen' && isClosed && (
           <button 
             className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors flex items-center justify-center gap-2"
             onClick={() => alert("Impact shareable generated! (Simulated social share)")}
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
             Share Civic Impact
           </button>
        )}
        
        {userRole === 'admin' && (
          <>
            {canPreparePacket(caseItem) && (
              <button className="w-full bg-[#0f284b] text-white font-bold text-sm py-4 rounded-full shadow-sm hover:bg-[#1a365d] transition-colors" onClick={() => preparePacket(caseItem.id)}>
                Prepare Reviewer Packet
              </button>
            )}
            {stage === 'Reviewer packet prepared' && (
              <button className="w-full bg-[#0f284b] text-white font-bold text-sm py-4 rounded-full shadow-sm hover:bg-[#1a365d] transition-colors" onClick={() => navigate(`/escalation/${caseItem.id}`)}>
                Review Packet
              </button>
            )}
            {stage === 'Reviewer packet prepared' && (
              <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-4 rounded-full shadow-sm transition-colors" onClick={() => claimRepair(caseItem.id)}>
                Claim Repair
              </button>
            )}
            {(stage === 'Fix verification needed' || stage === 'Fix verified' || stage === 'Closed' || stage === 'Field repair claimed') && (
              <button disabled className="w-full bg-slate-100 text-slate-500 font-bold text-sm py-4 rounded-full flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Sent to Field
              </button>
            )}
          </>
        )}
      </motion.div>

    </div>
  )
}

