import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Sparkles, MapPin, CheckCircle2, ShieldAlert, ArrowLeft, AlertTriangle, Link as LinkIcon, FilePlus } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';
import { CivicCase, Category } from '../types';
import { analyzeCivicIssue, AnalysisResult } from '../lib/gemini';
import { findDuplicateCandidates, DuplicateCandidate } from '../lib/issueDna';
import { AIScanner } from '../components/shared/AIScanner';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function ReportIssue() {
  const [step, setStep] = useState<1 | 2>(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { reportCase, attachEvidence, location, cases } = useDemo();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
      }, (err) => {
        console.warn("Geolocation failed", err);
      });
    }
  }, []);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setImageBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async () => {
    if (!imageBase64 || !imageMimeType) {
      setError('No image uploaded. Please upload an image first.');
      return;
    }

    setAnalyzing(true);
    setError('');
    
    const result = await analyzeCivicIssue({
      description: description || 'No additional description provided.',
      location: location || 'Current Location (Demo)',
      imageBase64,
      mimeType: imageMimeType
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
    
    // Add a tiny random offset so it doesn't perfectly overlap the user's location pin
    const latOffset = (Math.random() - 0.5) * 0.001;
    const lngOffset = (Math.random() - 0.5) * 0.001;

    const newCase: CivicCase = {
      id: `c-${Math.random().toString(36).substr(2, 9)}`,
      title: analysis.summary.substring(0, 50) + (analysis.summary.length > 50 ? '...' : ''),
      category: analysis.category as Category,
      locationLabel: location || 'Current Location (Demo)',
      lat: mapCenter[0] + latOffset,
      lng: mapCenter[1] + lngOffset,
      distance: '0.0 km',
      severity: analysis.severity,
      status: 'AI Analyzed',
      age: 'Just now',
      verificationCount: 0,
      trustScoreImpact: 10,
      evidenceQuality: analysis.evidenceQuality,
      suggestedDepartment: analysis.suggestedDepartment,
      aiSummary: analysis.summary,
      aiAdditionalSummary: analysis.additionalSummary,
      aiObjectiveDescription: analysis.objectiveDescription,
      locationSource: analysis.locationConfidence === 'High' ? 'Photo GPS' : 'Manual pin',
      duplicateRisk: duplicates.length > 0 ? 'High' : 'Low',
      proofLadderStage: 1,
      nextBestAction: 'Requires community verification.',
      authorId: user?.uid || 'me'
    };
    reportCase(newCase);
    navigate(`/case/${newCase.id}`);
  };

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-transparent min-h-screen pb-6">
      <header className="bg-white dark:bg-slate-900 px-6 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm border-b border-[#e2e8f0] dark:border-slate-800">
         <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
           <ArrowLeft className="w-6 h-6" />
         </button>
         <div className="flex flex-col">
           {step === 2 && (
             <span className="text-[10px] font-bold text-[#0f284b] dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
               <Sparkles className="w-3 h-3" /> Diagnostic Review
             </span>
           )}
           <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
             {step === 1 ? 'Report Issue' : 'Confirm Report'}
           </h1>
         </div>
      </header>

      {/* Progress Stepper */}
      <div className="bg-white dark:bg-slate-800 px-8 py-5 border-b border-[#e2e8f0] dark:border-slate-700 flex justify-center mb-2">
        <div className="flex items-center w-full max-w-[240px]">
          <div className="flex flex-col items-center gap-1 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 1 ? 'bg-[#0f284b] text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
              {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-5 whitespace-nowrap transition-colors duration-300 ${step >= 1 ? 'text-[#0f284b]' : 'text-slate-400'}`}>Evidence</span>
          </div>
          
          <div className="flex-1 h-1 mx-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full bg-[#0f284b] transition-all duration-500 ease-out`} style={{ width: step >= 2 ? '100%' : '0%' }} />
          </div>
          
          <div className="flex flex-col items-center gap-1 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 2 ? 'bg-[#0f284b] text-white shadow-sm' : 'bg-white border-2 border-[#e2e8f0] text-slate-400'}`}>
              2
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-5 whitespace-nowrap transition-colors duration-300 ${step >= 2 ? 'text-[#0f284b]' : 'text-slate-400'}`}>Review</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="p-6 flex flex-col gap-6 mt-2">
          <div className="bg-white border border-[#e2e8f0] p-4 rounded-[20px] flex items-start gap-3 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#0f284b] shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-snug font-medium">Snap a photo. CivicPulse AI extracts the details so you don't have to type.</p>
          </div>

          <div className="bg-white border-2 border-dashed border-[#e2e8f0] rounded-[24px] p-8 flex flex-col items-center justify-center text-center gap-4 shadow-sm relative overflow-hidden min-h-[280px]">
            <AIScanner isAnalyzing={analyzing} />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={analyzing}
              />
              <div className="w-16 h-16 bg-slate-100 text-[#0f284b] rounded-full flex items-center justify-center mb-1 transition-transform hover:scale-105 duration-300 mx-auto">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Camera className="w-8 h-8" />
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{imagePreview ? 'Image Selected' : 'Upload Evidence'}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                {imagePreview ? 'Tap to change photo' : 'Photos with visible landmarks process faster.'}
              </p>
            </div>
            
            {error && (
              <div className="text-red-500 text-xs font-medium bg-red-50 px-3 py-1.5 rounded-md mt-1">
                {error}
              </div>
            )}
            
            <button 
              onClick={handleAnalyzePhoto} 
              disabled={analyzing}
              className="mt-2 bg-[#0f284b] text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#1a365d] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" /> Analyze with Gemini
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Additional Details (Optional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-[20px] p-4 text-sm min-h-[100px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0f284b]/20 focus:border-[#0f284b] shadow-sm transition-all placeholder:text-slate-400 resize-none"
              placeholder="AI will draft a summary if you skip this..."
            />
          </div>

          <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-[20px] text-xs text-amber-900 flex items-start gap-2 shadow-sm">
             <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
             <p className="leading-relaxed"><strong>Privacy Standard:</strong> Avoid capturing faces, private homes, or vehicle plates when possible.</p>
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col gap-5 mt-2">
          {/* Evidence Preview */}
          <div className="h-48 bg-slate-200 rounded-[24px] relative flex items-center justify-center border border-[#e2e8f0] overflow-hidden shadow-sm">
            <ImageIcon className="w-12 h-12 text-slate-400" />
            <div className={`absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-[#e2e8f0]`}>
              {analysis?.confidence === 'High' ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Ready to review</>
              ) : analysis?.confidence === 'Medium' ? (
                <><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Review recommended</>
              ) : (
                <><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Check fields</>
              )}
            </div>
          </div>

          {/* Location Preview */}
          <div className="bg-white border border-[#e2e8f0] rounded-[24px] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#e2e8f0] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0f284b]" />
              <h3 className="font-bold text-slate-900 text-sm">Detected Location</h3>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[150px]">{location || 'Current Location (Demo)'}</span>
            </div>
            <div className="h-40 w-full bg-slate-100 relative z-0">
              <MapContainer 
                center={mapCenter} 
                zoom={15} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <MapUpdater center={mapCenter} />
                <Marker position={mapCenter} icon={customIcon} />
              </MapContainer>
            </div>
          </div>

          {(analysis?.evidenceQuality === 'Low' || analysis?.locationConfidence === 'Low') && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-[20px] flex gap-3 text-sm text-amber-900 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p><strong>Low Confidence Warning:</strong> We couldn't confidently extract the location or evidence quality is low. Please manually verify the details below.</p>
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="bg-white border-2 border-amber-200 rounded-[24px] overflow-hidden shadow-sm">
              <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-amber-900 text-sm">Possible existing case found</h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-900">{duplicates[0].existingCase.title}</span>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {duplicates[0].existingCase.distance}</span>
                    <span>-</span>
                    <span>{duplicates[0].existingCase.verificationCount} verifications</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 mt-2 text-xs text-slate-700 border border-[#e2e8f0]">
                    <strong>Overlap reason:</strong> {duplicates[0].reason} ({duplicates[0].score}% match)
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-1">
                  <button 
                    onClick={() => handleAttachEvidence(duplicates[0].existingCase.id)}
                    className="w-full bg-white border border-[#e2e8f0] text-[#0f284b] font-bold text-sm py-3 rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FilePlus className="w-4 h-4" /> Attach evidence to existing case
                  </button>
                  <div className="text-center mt-1">
                    <span className="text-xs font-medium text-slate-400">or continue below to create a separate case</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysis?.severity === 5 && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[24px] text-xs text-red-950 flex items-start gap-2.5 shadow-sm mt-1 mb-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5 animate-pulse" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#991b1b]">AI ESCALATION TRIGGER ARMED</span>
                <p className="text-slate-700 dark:text-slate-300 leading-normal font-medium">
                  This report matches <strong>Severity 5/5 Criteria</strong>. Submitting this issue will bypass standard Steward review and instantly fire an Automated Escalation SMS dispatch to city engineers and emergency planners.
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={confirmReport}
            className="w-full bg-[#0f284b] text-white font-bold text-sm py-4 mt-2 rounded-full shadow-sm hover:bg-[#1a365d] transition-colors"
          >
            Submit Official Report
          </button>

          {/* Editable Fields Container */}
          <div className="bg-white border border-[#e2e8f0] rounded-[24px] shadow-sm overflow-hidden flex flex-col divide-y divide-[#e2e8f0]">
            
            <div className="p-5 flex flex-col gap-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Title (Summary)</label>
               <input 
                 type="text" 
                 className="font-bold text-base text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0" 
                 value={analysis?.summary || ''} 
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, summary: e.target.value} : null)}
               />
            </div>

            <div className="p-5 flex flex-col gap-1 bg-[#f8f9fc] border-t border-[#e2e8f0]">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                 Objective Description <span className="text-[#0f284b]">De-Escalated</span>
               </label>
               <textarea 
                 className="text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none min-h-[60px] font-medium leading-relaxed" 
                 value={analysis?.objectiveDescription || ''} 
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, objectiveDescription: e.target.value} : null)}
               />
            </div>

            <div className="p-5 flex gap-4 border-t border-[#e2e8f0]">
               <div className="flex-1 flex flex-col gap-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                 <input 
                   type="text"
                   className="text-sm font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0"
                   value={analysis?.category || ''}
                   onChange={(e) => setAnalysis(prev => prev ? {...prev, category: e.target.value} : null)}
                 />
               </div>
               <div className="flex-1 flex flex-col gap-1 border-l border-[#e2e8f0] pl-5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
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

            <div className="p-5 flex flex-col gap-2 bg-[#f8f9fc]">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                 Missing Information <span className="text-[#0f284b]">AI Draft</span>
               </label>
               <textarea 
                 className="text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none min-h-[40px] font-medium leading-relaxed" 
                 value={analysis?.missingInformation?.join(', ') || 'None'} 
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, missingInformation: e.target.value.split(', ')} : null)}
               />
            </div>

            <div className="p-5 grid grid-cols-2 gap-y-5 gap-x-4">
               <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Dept</label>
                 <input 
                   type="text"
                   className="text-sm font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0"
                   value={analysis?.suggestedDepartment || ''}
                   onChange={(e) => setAnalysis(prev => prev ? {...prev, suggestedDepartment: e.target.value} : null)}
                 />
               </div>
               <div className="flex flex-col gap-1 border-l border-[#e2e8f0] pl-5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location Confidence</label>
                 <select 
                   className="text-sm font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 appearance-none"
                   value={analysis?.locationConfidence || 'Medium'}
                   onChange={(e) => setAnalysis(prev => prev ? {...prev, locationConfidence: e.target.value as "High"|"Medium"|"Low"} : null)}
                 >
                   <option value="High">High</option>
                   <option value="Medium">Medium</option>
                   <option value="Low">Low</option>
                 </select>
               </div>
               <div className="flex flex-col gap-1 pt-5 border-t border-[#e2e8f0] col-span-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evidence Quality</label>
                 <select 
                   className="text-sm font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 appearance-none"
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

          {/* Spacer for sticky bottom action */}
          <div className="h-4"></div>
        </div>
      )}

      {/* Sticky Bottom Action */}
      {step === 2 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto w-full bg-white border-t border-[#e2e8f0] p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.08)] z-20">
           <button 
             onClick={confirmReport}
             className="w-full bg-[#0f284b] text-white font-bold text-sm py-4 rounded-full shadow-sm hover:bg-[#1a365d] transition-colors"
           >
             Submit Official Report
           </button>
        </div>
      )}
    </div>
  )
}


