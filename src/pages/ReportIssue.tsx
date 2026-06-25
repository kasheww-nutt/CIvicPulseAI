import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Sparkles, MapPin, CheckCircle2, ShieldAlert, ArrowLeft, AlertTriangle, Link as LinkIcon, FilePlus } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { CivicCase, Category } from '../types';
import { analyzeCivicIssue, AnalysisResult } from '../lib/gemini';
import { findDuplicateCandidates, DuplicateCandidate } from '../lib/issueDna';

export function ReportIssue() {
  const [step, setStep] = useState<1 | 2>(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const { reportCase, attachEvidence, location, cases } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    if (analysis && step === 2) {
      const dummyDraft = {
        title: analysis.summary,
        category: analysis.category as Category,
        locationLabel: location || 'Current Location (Demo)',
        severity: analysis.severity,
      };
      const candidates = findDuplicateCandidates(dummyDraft, cases);
      setDuplicates(candidates);
    }
  }, [analysis, step, location, cases]);

  const handleDemoPhoto = async () => {
    setAnalyzing(true);
    
    // Simulate finding image data or just passing description
    const result = await analyzeCivicIssue({
      description: description || 'Large pothole on the main road',
      location: location || 'Current Location (Demo)'
    });
    
    setAnalysis(result);
    setAnalyzing(false);
    setStep(2);
  };

  const handleAttachEvidence = (existingId: string) => {
    attachEvidence(existingId, analysis?.evidenceQuality || 'Medium');
    navigate(`/case/${existingId}`);
  };

  const confirmReport = () => {
    if (!analysis) return;
    
    const newCase: CivicCase = {
      id: `c-${Math.random().toString(36).substr(2, 9)}`,
      title: analysis.summary.substring(0, 50) + (analysis.summary.length > 50 ? '...' : ''),
      category: analysis.category as Category,
      locationLabel: location || 'Current Location (Demo)',
      distance: '0.0 km',
      severity: analysis.severity,
      status: 'AI Analyzed',
      age: 'Just now',
      verificationCount: 0,
      trustScoreImpact: 10,
      evidenceQuality: analysis.evidenceQuality,
      suggestedDepartment: analysis.suggestedDepartment,
      aiSummary: analysis.summary,
      locationSource: analysis.locationConfidence === 'High' ? 'Photo GPS' : 'Manual pin',
      duplicateRisk: duplicates.length > 0 ? 'High' : 'Low',
      proofLadderStage: 1,
      nextBestAction: 'Requires community verification.'
    };
    reportCase(newCase);
    navigate(`/case/${newCase.id}`);
  };

  if (step === 1) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
         <header className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10">
           <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-slate-900">
             <ArrowLeft className="w-5 h-5" />
           </button>
           <h1 className="text-lg font-bold text-slate-900">Report Issue</h1>
         </header>

         <div className="p-4 flex flex-col gap-6">
           <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
             <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
             <p className="text-sm text-blue-900 leading-snug font-medium">Snap a photo. CivicPulse AI extracts the details so you don't have to type.</p>
           </div>

           <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 shadow-sm relative overflow-hidden">
             {analyzing && (
               <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                 <Sparkles className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                 <span className="text-sm font-bold text-slate-700">Analyzing evidence...</span>
               </div>
             )}
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1">
                <Camera className="w-8 h-8" />
             </div>
             <div>
               <h3 className="font-bold text-slate-900">Upload Evidence</h3>
               <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">Photos with visible landmarks process faster.</p>
             </div>
             
             <button 
               onClick={handleDemoPhoto} 
               disabled={analyzing}
               className="mt-2 bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
             >
               <Camera className="w-4 h-4" /> Analyze with Gemini
             </button>
           </div>
           
           <div className="flex flex-col gap-2">
             <label className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Additional Details (Optional)</label>
             <textarea 
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[80px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all placeholder:text-slate-400 resize-none"
               placeholder="AI will draft a summary if you skip this..."
             />
           </div>

           <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <p className="leading-relaxed"><strong>Privacy Standard:</strong> Avoid capturing faces, private homes, or vehicle plates when possible.</p>
           </div>
         </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-20">
      <header className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10">
         <button onClick={() => setStep(1)} className="p-1 -ml-1 text-slate-500 hover:text-slate-900">
           <ArrowLeft className="w-5 h-5" />
         </button>
         <div className="flex flex-col">
           <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
             <Sparkles className="w-3 h-3" /> Diagnostic Review
           </span>
           <h1 className="text-lg font-bold text-slate-900 leading-tight">Confirm Report</h1>
         </div>
      </header>

      <div className="p-4 flex flex-col gap-4">
        {/* Evidence Preview */}
        <div className="h-40 bg-slate-200 rounded-xl relative flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
          <ImageIcon className="w-10 h-10 text-slate-400" />
          <div className={`absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm`}>
            {analysis?.confidence === 'High' ? (
              <><CheckCircle2 className="w-3 h-3 text-green-400" /> Ready to review and confirm</>
            ) : analysis?.confidence === 'Medium' ? (
              <><ShieldAlert className="w-3 h-3 text-amber-400" /> Review recommended</>
            ) : (
              <><AlertTriangle className="w-3 h-3 text-red-400" /> Add evidence or correct fields</>
            )}
          </div>
        </div>

        {(analysis?.evidenceQuality === 'Low' || analysis?.locationConfidence === 'Low') && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3 text-sm text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p><strong>Low Confidence Warning:</strong> We couldn't confidently extract the location or evidence quality is low. Please manually verify the details below.</p>
          </div>
        )}

        {duplicates.length > 0 && (
          <div className="bg-white border-2 border-blue-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-blue-50 border-b border-blue-100 p-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-blue-900 text-sm">Possible existing case found</h3>
            </div>
            <div className="p-3 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-900">{duplicates[0].existingCase.title}</span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {duplicates[0].existingCase.distance}</span>
                  <span>-</span>
                  <span>{duplicates[0].existingCase.verificationCount} verifications</span>
                </div>
                <div className="bg-slate-100 rounded p-2 mt-1 text-xs text-slate-600">
                  <strong>Overlap reason:</strong> {duplicates[0].reason} ({duplicates[0].score}% match)
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-1">
                <button 
                  onClick={() => handleAttachEvidence(duplicates[0].existingCase.id)}
                  className="w-full bg-blue-600 text-white font-bold text-sm py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FilePlus className="w-4 h-4" /> Attach evidence to existing case
                </button>
                <div className="text-center">
                  <span className="text-xs text-slate-500">or continue below to create a separate case</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editable Fields Container */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col divide-y divide-slate-100">
          
          <div className="p-4 flex flex-col gap-1">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Issue Title (Summary)</label>
             <input 
               type="text" 
               className="font-bold text-base text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0" 
               value={analysis?.summary || ''} 
               onChange={(e) => setAnalysis(prev => prev ? {...prev, summary: e.target.value} : null)}
             />
          </div>

          <div className="p-4 flex gap-4">
             <div className="flex-1 flex flex-col gap-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
               <input 
                 type="text"
                 className="text-sm font-semibold text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                 value={analysis?.category || ''}
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, category: e.target.value} : null)}
               />
             </div>
             <div className="flex-1 flex flex-col gap-1 border-l border-slate-100 pl-4">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity</label>
               <select 
                 className="text-sm font-bold text-red-600 bg-transparent border-none outline-none focus:ring-0 p-0 appearance-none"
                 value={analysis?.severity || 3}
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, severity: parseInt(e.target.value) as 1|2|3|4|5} : null)}
               >
                 <option value={5}>Severity 5 (Urgent)</option>
                 <option value={4}>Severity 4 (High)</option>
                 <option value={3}>Severity 3 (Medium)</option>
                 <option value={2}>Severity 2 (Low)</option>
                 <option value={1}>Severity 1 (Minor)</option>
               </select>
             </div>
          </div>

          <div className="p-4 flex flex-col gap-1 bg-slate-50/50">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
               Missing Information <span className="text-blue-600">AI Draft</span>
             </label>
             <textarea 
               className="text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none min-h-[40px] font-medium leading-relaxed" 
               value={analysis?.missingInformation?.join(', ') || 'None'} 
               onChange={(e) => setAnalysis(prev => prev ? {...prev, missingInformation: e.target.value.split(', ')} : null)}
             />
          </div>

          <div className="p-4 grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Dept</label>
               <input 
                 type="text"
                 className="text-sm font-semibold text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                 value={analysis?.suggestedDepartment || ''}
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, suggestedDepartment: e.target.value} : null)}
               />
             </div>
             <div className="flex flex-col gap-1 border-l border-slate-100 pl-4">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location Confidence</label>
               <select 
                 className="text-sm font-semibold text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0 appearance-none"
                 value={analysis?.locationConfidence || 'Medium'}
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, locationConfidence: e.target.value as "High"|"Medium"|"Low"} : null)}
               >
                 <option value="High">High</option>
                 <option value="Medium">Medium</option>
                 <option value="Low">Low</option>
               </select>
             </div>
             <div className="flex flex-col gap-1 pt-4 border-t border-slate-100 col-span-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evidence Quality</label>
               <select 
                 className="text-sm font-semibold text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0 appearance-none"
                 value={analysis?.evidenceQuality || 'Medium'}
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, evidenceQuality: e.target.value as "High"|"Medium"|"Low"} : null)}
               >
                 <option value="High">High</option>
                 <option value="Medium">Medium</option>
                 <option value="Low">Low</option>
               </select>
             </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-slate-200 p-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-20">
         <button 
           onClick={confirmReport}
           className="w-full bg-blue-600 text-white font-bold text-sm py-3.5 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
         >
           Confirm report draft
         </button>
      </div>
    </div>
  )
}

