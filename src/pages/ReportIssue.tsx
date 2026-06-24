import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Sparkles, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useDemo } from '../context/DemoContext';
import { Badge } from '../components/ui/Badge';
import { CivicCase } from '../types';

export function ReportIssue() {
  const [step, setStep] = useState<1 | 2>(1);
  const [analyzing, setAnalyzing] = useState(false);
  const { reportCase, location } = useDemo();
  const navigate = useNavigate();

  const handleDemoPhoto = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setStep(2);
    }, 1500);
  };

  const confirmReport = () => {
    const newCase: CivicCase = {
      id: `c-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Large sinkhole on main road',
      category: 'Pothole / road damage',
      locationLabel: location || 'Current Location (Demo)',
      distance: '0.0 km',
      severity: 5,
      status: 'AI Analyzed',
      age: 'Just now',
      verificationCount: 0,
      trustScoreImpact: 10,
      evidenceQuality: 'High',
      suggestedDepartment: 'Public Works Department (PWD)',
      aiSummary: 'Large sinkhole detected, roughly 4ft diameter. Severe hazard to vehicles and pedestrians. Clear visibility of depth.',
      locationSource: 'Photo GPS',
      duplicateRisk: 'Low',
      proofLadderStage: 1,
      nextBestAction: 'Requires community verification.'
    };
    reportCase(newCase);
    navigate(`/case/${newCase.id}`);
  };

  if (step === 1) {
    return (
      <div className="flex flex-col gap-6 max-w-xl mx-auto">
         <header className="flex flex-col gap-2">
           <h1 className="text-2xl font-bold tracking-tight text-slate-900">Report an Issue</h1>
           <p className="text-slate-600 text-sm">Snap a photo. CivicPulse AI extracts the category, severity, and location so you don't have to type.</p>
         </header>

         <Card className="bg-slate-50 border-dashed border-2 border-slate-300 shadow-sm">
           <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center text-center gap-4">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <Camera className="w-8 h-8" />
             </div>
             <div>
               <h3 className="font-semibold text-slate-900">Upload Evidence</h3>
               <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Photos with visible landmarks process faster.</p>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center">
               <Button onClick={handleDemoPhoto} size="lg" className="gap-2 font-semibold" disabled={analyzing}>
                 {analyzing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                 {analyzing ? 'Analyzing evidence...' : 'Take Photo (Demo)'}
               </Button>
             </div>
           </CardContent>
         </Card>
         
         <div className="flex flex-col gap-1.5">
           <label className="text-sm font-semibold text-slate-900">Additional Details (Optional)</label>
           <textarea 
             className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
             placeholder="AI will draft a summary if you skip this..."
           />
         </div>

         <div className="bg-slate-100 p-4 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
            <p><strong>Privacy Standard:</strong> Uploaded evidence may include public-space details. Avoid capturing faces, private homes, or vehicle plates when possible.</p>
         </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <header className="flex flex-col gap-2">
         <div className="flex items-center gap-2 text-blue-600">
           <Sparkles className="w-5 h-5" />
           <span className="font-semibold text-sm uppercase tracking-wider">Diagnostic Review</span>
         </div>
         <h1 className="text-2xl font-bold tracking-tight text-slate-900">Confirm Report</h1>
      </header>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-48 bg-slate-100 relative flex items-center justify-center border-b border-slate-200">
            <ImageIcon className="w-12 h-12 text-slate-300" />
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-green-400" /> High Confidence
            </div>
          </div>
          <div className="p-5 md:p-6 flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start mb-3">
                <Badge className="bg-slate-100 text-slate-800 border-slate-200 font-semibold">{`Pothole / road damage`}</Badge>
                <div className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                  Sev 5
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Large sinkhole on main road</h2>
              <p className="text-slate-600 text-sm leading-relaxed p-3 bg-slate-50 rounded-lg border border-slate-100">
                Large sinkhole detected, roughly 4ft diameter. Severe hazard to vehicles and pedestrians. Clear visibility of depth.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Suggested Dept</span>
                 <span className="text-sm font-medium text-slate-900">Public Works (PWD)</span>
              </div>
              <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Location Source</span>
                 <span className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                   <MapPin className="w-3.5 h-3.5 text-blue-500" /> Photo GPS
                 </span>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1 font-semibold" onClick={confirmReport}>
                Confirm & Submit
              </Button>
              <Button size="lg" variant="outline" className="flex-1 font-semibold bg-white" onClick={() => setStep(1)}>
                Edit Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
