import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowLeft, 
  AlertTriangle, 
  Link as LinkIcon, 
  FilePlus, 
  Video, 
  VideoOff, 
  Play, 
  Pause, 
  RefreshCw, 
  Terminal, 
  Volume2, 
  X, 
  Radio, 
  Zap,
  Sliders,
  Cpu,
  Mic 
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';
import { CivicCase, Category } from '../types';
import { analyzeCivicIssue, AnalysisResult } from '../lib/gemini';
import { findDuplicateCandidates, DuplicateCandidate } from '../lib/issueDna';
import { AIScanner } from '../components/shared/AIScanner';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';

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

// Preset simulator data for Live Video mode
interface PresetInfo {
  imageUrl: string;
  analysis: AnalysisResult;
  voiceCaption: string;
}

const PRESET_DATA: Record<string, PresetInfo> = {
  pothole: {
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
    analysis: {
      category: 'Pothole / Road Damage',
      summary: 'Hazardous deep pothole detected in center lane. Roughly 3 feet wide, posing a severe hazard to passing vehicles.',
      objectiveDescription: 'A significant asphalt pothole, approximately 3 feet in width and filled with rainwater, is located in the driving lane. Creating an immediate collision or damage risk.',
      severity: 4,
      suggestedDepartment: 'Public Works Department',
      locationConfidence: 'High',
      evidenceQuality: 'High',
      missingInformation: ['Sub-surface depth'],
      duplicateClues: [],
      citizenSafetyNote: 'Slow down. Pothole is deep and filled with rainwater.',
      confidence: 'High'
    },
    voiceCaption: "Gemini Live Assistant: I have detected a hazardous pothole in the roadway. Severity has been classified as 4 out of 5 due to immediate vehicle damage risks. Dispatch queued for Public Works."
  },
  streetlight: {
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
    analysis: {
      category: 'Streetlight / Electrical',
      summary: 'Broken municipal streetlight adjacent to active pedestrian crosswalk. Creating complete darkness.',
      objectiveDescription: 'A public streetlight adjacent to the marked crosswalk is completely non-functional, creating unsafe darkness for pedestrians and drivers.',
      severity: 3,
      suggestedDepartment: 'Electrical and Grid Services',
      locationConfidence: 'High',
      evidenceQuality: 'High',
      missingInformation: [],
      duplicateClues: [],
      citizenSafetyNote: 'Be extremely careful when crossing the dark roadway.',
      confidence: 'High'
    },
    voiceCaption: "Gemini Live Assistant: broken streetlight identified near crosswalk. Assigned to Electrical Services with severity 3 out of 5. Keeping crosswalk users safe is priority."
  },
  waterleak: {
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=600',
    analysis: {
      category: 'Water Leak / Hydrant',
      summary: 'Pressurized water leak/burst pipe detected. Flooding public sidewalk with high volume discharge.',
      objectiveDescription: 'A ruptured high-pressure water main is actively discharging clean drinking water onto the sidewalk and roadway, causing heavy localized flooding.',
      severity: 5,
      suggestedDepartment: 'Water and Sanitation Board',
      locationConfidence: 'High',
      evidenceQuality: 'High',
      missingInformation: ['Main valve location'],
      duplicateClues: [],
      citizenSafetyNote: 'Sidewalk is flooded. Avoid direct contact due to high pressure.',
      confidence: 'High'
    },
    voiceCaption: "Gemini Live Assistant: CRITICAL SEVERITY 5 issue identified. High pressure water main rupture with street flooding. Armed emergency bypass dispatch is firing instantly to the Water Board."
  },
  littering: {
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600',
    analysis: {
      category: 'Littering / Waste Dump',
      summary: 'Illegal bulk domestic waste accumulation dumped near community park entrance.',
      objectiveDescription: 'A pile of unauthorized domestic trash, including bags and cardboard boxes, has been dumped near the public green space border.',
      severity: 2,
      suggestedDepartment: 'Sanitation and Recycling',
      locationConfidence: 'Medium',
      evidenceQuality: 'High',
      missingInformation: [],
      duplicateClues: [],
      citizenSafetyNote: 'Sanitation crew notified. Avoid contact with discarded bags.',
      confidence: 'High'
    },
    voiceCaption: "Gemini Live Assistant: Illegal waste dumping detected near park entrance. Severity is classified as 2 out of 5. Sanitation dispatch ticket has been filed."
  }
};

export function ReportIssue() {
  const [reportMethod, setReportMethod] = useState<'photo' | 'live' | null>(null);
  const [photoSource, setPhotoSource] = useState<'upload' | 'camera'>('upload');
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
  
  // Camera streams
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const snapshotVideoRef = useRef<HTMLVideoElement>(null);

  // Gemini Live Video mode states
  const [showNerdStats, setShowNerdStats] = useState(false);
  const [autoTransitioning, setAutoTransitioning] = useState(false);
  const [isAssistantScanning, setIsAssistantScanning] = useState(true);
  const [assistantLogs, setAssistantLogs] = useState<string[]>([]);
  const [speechCaption, setSpeechCaption] = useState('Gemini Live Assistant: Initializing camera feed. Point at a civic issue to begin real-time analysis...');
  const [simulatedPreset, setSimulatedPreset] = useState<'none' | 'pothole' | 'streetlight' | 'waterleak' | 'littering'>('none');
  const [isSimulated, setIsSimulated] = useState(false);
  const [liveLockResult, setLiveLockResult] = useState<AnalysisResult | null>(null);

  const { reportCase, attachEvidence, location, cases } = useDemo();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Add terminal log helper
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAssistantLogs(prev => [...prev.slice(-3), `[${timestamp}] ${msg}`]);
  };

  // Setup geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
      }, (err) => {
        console.warn("Geolocation failed", err);
      });
    }
  }, []);

  // Sync duplicates
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

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Manage camera for Snapshot Mode
  useEffect(() => {
    if (reportMethod === 'photo' && photoSource === 'camera') {
      startSnapshotCamera();
    } else {
      stopCamera();
    }
  }, [reportMethod, photoSource]);

  // Manage camera for Gemini Live Video Mode
  useEffect(() => {
    if (reportMethod === 'live') {
      setAssistantLogs([]);
      addLog("Initializing Gemini Live Video Session...");
      if (simulatedPreset !== 'none') {
        setIsSimulated(true);
        stopCamera();
        handlePresetScan(simulatedPreset);
      } else {
        setIsSimulated(false);
        startLiveAssistantCamera();
      }
    } else {
      stopCamera();
    }
  }, [reportMethod, simulatedPreset]);

  // Continuous scanner emulation interval for Real-time camera
  useEffect(() => {
    if (reportMethod !== 'live' || isSimulated || !isAssistantScanning) return;

    addLog("Real-time camera frames connected. Analyzing feed at 1 FPS...");
    const interval = setInterval(() => {
      // Periodic automatic capture and real API call simulation or real frame call
      handleLiveRealFrameScan();
    }, 4500);

    return () => clearInterval(interval);
  }, [reportMethod, isSimulated, isAssistantScanning, cameraStream]);

  // Handle preset simulation selection
  const handlePresetScan = (presetKey: string) => {
    if (presetKey === 'none') {
      setIsSimulated(false);
      startLiveAssistantCamera();
      return;
    }
    
    addLog(`Simulated feed connected: ${presetKey.toUpperCase()} preset.`);
    setAnalyzing(true);
    setAutoTransitioning(false);
    
    // Simulate brief scanning delay
    setTimeout(() => {
      const preset = PRESET_DATA[presetKey];
      if (preset) {
        setLiveLockResult(preset.analysis);
        setSpeechCaption(preset.voiceCaption);
        setImagePreview(preset.imageUrl);
        // Set some dummy base64 to allow step 2 validation
        setImageBase64("MOCK_PRESET_BASE64");
        setImageMimeType("image/jpeg");
        addLog(`Gemini: ${preset.analysis.category} detected.`);
        
        // Auto-transition
        setAutoTransitioning(true);
        setTimeout(() => {
          setAnalysis(preset.analysis);
          stopCamera();
          setStep(2);
          setAutoTransitioning(false);
        }, 1800);
      }
      setAnalyzing(false);
    }, 1500);
  };

  // Actually scan live webcam frame through Gemini API
  const handleLiveRealFrameScan = async () => {
    if (!videoRef.current || isSimulated || autoTransitioning) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64 = dataUrl.split(',')[1];

      addLog("Transmitting active frame to Gemini...");
      setAnalyzing(true);

      const result = await analyzeCivicIssue({
        description: 'Real-time video frame diagnostic scan.',
        location: location || 'Current Location (Demo)',
        imageBase64: base64,
        mimeType: 'image/jpeg'
      });

      if (result) {
        if (result.isCivicIssue === false) {
          setSpeechCaption("Gemini Live Assistant: Scanning... No municipal hazard detected in current frame. Please point the camera towards a real civic issue.");
          addLog("Gemini: Frame checked. No civic issue detected.");
          setAnalyzing(false);
          return;
        }

        setLiveLockResult(result);
        setImagePreview(dataUrl);
        setImageBase64(base64);
        setImageMimeType('image/jpeg');
        
        // Generate contextual verbal caption
        const verbal = `Gemini Live Assistant: I see a suspected ${result.category} issue here. evidence quality is ${result.evidenceQuality}. Generating official draft...`;
        setSpeechCaption(verbal);
        addLog(`Gemini: Detected ${result.category}.`);

        // Auto-transition
        setAutoTransitioning(true);
        setTimeout(() => {
          setAnalysis(result);
          stopCamera();
          setStep(2);
          setAutoTransitioning(false);
        }, 1800);
      }
      setAnalyzing(false);
    } catch (e: any) {
      console.warn("Frame analysis failed:", e);
      addLog(`Scan failed: ${e.message || "Point camera at high-contrast subject."}`);
      setAnalyzing(false);
    }
  };

  // Start Physical Camera for Snapshot Mode
  const startSnapshotCamera = async () => {
    try {
      stopCamera();
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(s);
      setTimeout(() => {
        if (snapshotVideoRef.current) {
          snapshotVideoRef.current.srcObject = s;
        }
      }, 100);
    } catch (err) {
      console.warn("Snapshot Camera access failed", err);
      setError("Cannot access camera. Switching to device upload.");
      setPhotoSource('upload');
    }
  };

  // Start Physical Camera for Live Assistant
  const startLiveAssistantCamera = async () => {
    try {
      stopCamera();
      addLog("Requesting hardware camera access...");
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(s);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      }, 100);
      addLog("Webcam stream active.");
    } catch (err) {
      console.warn("Live Camera access failed", err);
      addLog("Hardware camera unavailable. Falling back to simulated feeds.");
      setIsSimulated(true);
      setSimulatedPreset('pothole');
      handlePresetScan('pothole');
    }
  };

  // Stop current camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Handle Snapping a Photo in Standard Camera Mode
  const handleTakeSnapshot = () => {
    if (!snapshotVideoRef.current) return;

    const video = snapshotVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64String = dataUrl.split(',')[1];
      
      setImagePreview(dataUrl);
      setImageBase64(base64String);
      setImageMimeType('image/jpeg');
      stopCamera();
      setPhotoSource('upload'); // Switch back to preview state
    }
  };

  // Handle standard upload files
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

  // Trigger Gemini analysis on captured snapshot or uploaded file
  const handleAnalyzePhoto = async () => {
    if (!imageBase64 || !imageMimeType) {
      setError('Please provide an image first.');
      return;
    }

    setAnalyzing(true);
    setError('');
    
    try {
      const result = await analyzeCivicIssue({
        description: description || 'No additional description provided.',
        location: location || 'Current Location (Demo)',
        imageBase64,
        mimeType: imageMimeType
      });
      
      if (result.isCivicIssue === false) {
        setError(`No civic issue detected in the provided image (Identified as: ${result.additionalSummary || 'unrelated subject'}). Please upload or capture an image containing a real municipal/civic issue (e.g. a pothole, streetlight out, water leak, or garbage dump).`);
        return;
      }
      
      setAnalysis(result);
      setStep(2);
    } catch (e: any) {
      console.error("Analysis failed:", e);
      setError(`Analysis failed: ${e.message || "Please check your network and GEMINI_API_KEY."}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Lock in live/simulated diagnostic report results
  const handleLockLiveResult = () => {
    if (!liveLockResult) return;
    setAnalysis(liveLockResult);
    stopCamera();
    setStep(2);
  };

  // Attach evidence to existing duplicate
  const handleAttachEvidence = (existingId: string) => {
    attachEvidence(existingId, analysis?.evidenceQuality || 'Medium');
    navigate(`/case/${existingId}`);
  };

  // Submit case to database
  const confirmReport = () => {
    if (!analysis) return;
    
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
      status: 'Reported',
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
      authorId: user?.uid || 'me',
      imagePlaceholder: imagePreview || undefined
    };
    reportCase(newCase);
    navigate(`/case/${newCase.id}`);
  };

  // Render 0: Choose Capture Method Screen
  if (reportMethod === null) {
    return (
      <div className="flex flex-col bg-[#f8f9fc] dark:bg-slate-950 min-h-screen">
        <header className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center gap-3 border-b border-[#e2e8f0] dark:border-slate-800 shadow-sm sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Report New Issue</h1>
        </header>

        <div className="p-6 flex flex-col gap-6 max-w-[430px] mx-auto w-full flex-1 justify-center">
          <div className="text-center flex flex-col gap-2">
            <div className="w-16 h-16 bg-[#0f284b] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI Report Assistant</h2>
            <p className="text-sm text-slate-500 max-w-[320px] mx-auto leading-relaxed">
              Choose your reporting method. Gemini AI automatically extracts, translates, and dispatches cases.
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {/* Standard Card */}
            <button
              onClick={() => {
                setReportMethod('photo');
                setStep(1);
              }}
              className="group text-left bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 hover:border-[#0f284b] dark:hover:border-cyan-500 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#0f284b] dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 pr-4">
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#0f284b] dark:group-hover:text-cyan-400 transition-colors">Standard Photo & File</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Snap a live snapshot or upload from your device gallery. Ideal for quick submissions.</span>
              </div>
            </button>

            {/* Live Video Card */}
            <button
              onClick={() => {
                setReportMethod('live');
                setStep(1);
              }}
              className="group text-left bg-[#0f284b] text-white p-5 rounded-[24px] shadow-md hover:shadow-lg hover:bg-[#15345f] transition-all duration-300 flex items-start gap-4 relative overflow-hidden border border-slate-800"
            >
              {/* Decorative aura */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
              
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform relative">
                <Video className="w-6 h-6 animate-pulse" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f284b] animate-ping" />
              </div>
              <div className="flex flex-col gap-1 pr-4 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Gemini Live Video Assistant</span>
                  <span className="text-[9px] font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Vision</span>
                </div>
                <span className="text-xs text-slate-300 leading-relaxed">Interactive continuous scan. Stream live footage and Gemini will voice observations and auto-draft.</span>
              </div>
            </button>
          </div>

          <div className="text-center mt-2">
            <button onClick={() => navigate(-1)} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              Cancel and Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-slate-950 min-h-screen pb-6">
      <header className="bg-white dark:bg-slate-900 px-6 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm border-b border-[#e2e8f0] dark:border-slate-800">
        <button 
          onClick={() => {
            if (step === 2) {
              setStep(1);
            } else {
              setReportMethod(null);
            }
          }} 
          className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          {step === 2 && (
            <span className="text-[10px] font-bold text-[#0f284b] dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Diagnostic Review
            </span>
          )}
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
            {step === 1 ? (reportMethod === 'live' ? 'Live Assistant' : 'Report Issue') : 'Confirm Report'}
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
            <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-5 whitespace-nowrap transition-colors duration-300 ${step >= 1 ? 'text-[#0f284b] dark:text-white' : 'text-slate-400'}`}>Evidence</span>
          </div>
          
          <div className="flex-1 h-1 mx-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full bg-[#0f284b] dark:bg-cyan-400 transition-all duration-500 ease-out`} style={{ width: step >= 2 ? '100%' : '0%' }} />
          </div>
          
          <div className="flex flex-col items-center gap-1 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 2 ? 'bg-[#0f284b] text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-2 border-[#e2e8f0] dark:border-slate-700 text-slate-400'}`}>
              2
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-5 whitespace-nowrap transition-colors duration-300 ${step >= 2 ? 'text-[#0f284b] dark:text-white' : 'text-slate-400'}`}>Review</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        reportMethod === 'photo' ? (
          /* STANDARD PHOTO CAPTURE MODE */
          <div className="p-6 flex flex-col gap-6 mt-2 max-w-[430px] mx-auto w-full">
            <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 p-4 rounded-[20px] flex items-start gap-3 shadow-sm">
              <Sparkles className="w-5 h-5 text-[#0f284b] dark:text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug font-medium">Snap a quick photo using Snapshot Camera or select a file. Gemini Vision extracts information immediately.</p>
            </div>

            {/* Photo Capture Source Toggle */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold shadow-sm">
              <button 
                onClick={() => setPhotoSource('upload')} 
                className={`py-2 rounded-full transition-all ${photoSource === 'upload' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                File Upload / Gallery
              </button>
              <button 
                onClick={() => setPhotoSource('camera')} 
                className={`py-2 rounded-full transition-all ${photoSource === 'camera' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Snapshot Camera
              </button>
            </div>

            {photoSource === 'upload' ? (
              /* FILE UPLOAD & PREVIEW AREA */
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-[#e2e8f0] dark:border-slate-800 rounded-[24px] p-8 flex flex-col items-center justify-center text-center gap-4 shadow-sm relative overflow-hidden min-h-[280px]">
                <AIScanner isAnalyzing={analyzing} />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={analyzing}
                  />
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-[#0f284b] dark:text-cyan-400 rounded-full flex items-center justify-center mb-1 transition-transform hover:scale-105 duration-300 mx-auto overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8" />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{imagePreview ? 'Image Selected' : 'Upload Evidence'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] mx-auto">
                    {imagePreview ? 'Tap circular icon to change photo' : 'Photos with clear landmarks analyze fastest.'}
                  </p>
                </div>
                
                {error && (
                  <div className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-md mt-1">
                    {error}
                  </div>
                )}
                
                <button 
                  onClick={handleAnalyzePhoto} 
                  disabled={analyzing || !imageBase64}
                  className="mt-2 bg-[#0f284b] dark:bg-cyan-500 text-white dark:text-slate-950 px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#1a365d] dark:hover:bg-cyan-400 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400 dark:text-slate-950" /> Analyze with Gemini
                </button>
              </div>
            ) : (
              /* SNAPSHOT LIVE CAMERA AREA */
              <div className="bg-slate-900 rounded-[24px] p-4 flex flex-col gap-4 relative overflow-hidden min-h-[320px] shadow-lg border border-slate-800">
                <AIScanner isAnalyzing={analyzing} />
                
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <video 
                    ref={snapshotVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* High tech camera bracket overlay */}
                  <div className="absolute inset-4 border border-white/20 pointer-events-none rounded flex items-center justify-center">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0" />
                    <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400 absolute bottom-0 left-0" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400 absolute bottom-0 right-0" />
                    <div className="w-2 h-2 rounded-full bg-red-500 absolute top-3 right-3 animate-pulse" />
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => {
                      stopCamera();
                      setPhotoSource('upload');
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs py-3 rounded-xl transition-all"
                  >
                    Cancel / Gallery
                  </button>
                  <button 
                    onClick={handleTakeSnapshot}
                    className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" /> Take Snapshot
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">Additional Details (Optional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#e2e8f0] dark:border-slate-800 rounded-[20px] p-4 text-sm min-h-[100px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f284b]/20 dark:focus:ring-cyan-500/20 shadow-sm transition-all placeholder:text-slate-400 resize-none"
                placeholder="AI will draft a summary if you skip this..."
              />
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-[20px] text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 shadow-sm">
               <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
               <p className="leading-relaxed"><strong>Privacy Standard:</strong> Avoid capturing faces, private homes, or vehicle plates when possible.</p>
            </div>
          </div>
        ) : (
          /* IMMERSIVE GEMINI LIVE VIDEO ASSISTANT MODE */
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-[580px] p-6 flex flex-col justify-between max-w-[430px] mx-auto w-full rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
            
            {/* Header */}
            <div className="flex items-center justify-between w-full pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f284b] dark:bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0f284b] dark:bg-cyan-500"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black tracking-wider text-[#0f284b] dark:text-cyan-400 uppercase">Gemini Live</span>
                  <span className="text-[10px] text-slate-500 font-medium">Civic Vision Assistant</span>
                </div>
              </div>
              
              {/* Nerd Stats Toggle Button */}
              <button
                onClick={() => setShowNerdStats(!showNerdStats)}
                className={`py-1.5 px-3 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all ${showNerdStats ? 'bg-[#0f284b]/10 text-[#0f284b] border border-[#0f284b]/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:text-slate-700'}`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Nerd Stats {showNerdStats ? 'On' : 'Off'}
              </button>
            </div>

            {/* Immersive Viewfinder & Waveform Column */}
            <div className="flex-1 flex flex-col items-center justify-center py-6 gap-6 w-full">
              
              {/* Beautiful Immersive Full Camera Viewfinder */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-950 flex items-center justify-center">
                
                {/* Mount Keyed Animation Wrapper for Shutter effects */}
                <div key={`${simulatedPreset}-${isAssistantScanning}`} className="absolute inset-0 flex items-center justify-center">
                  
                  {/* Real Camera Video or Simulated Image Scene */}
                  <div className="w-full h-full relative flex items-center justify-center">
                    {isSimulated && imagePreview ? (
                      <img src={imagePreview} alt="Simulated Scene" className="w-full h-full object-cover" />
                    ) : (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    )}
                  </div>

                  {/* 3x3 Rule-of-Thirds Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-10 dark:opacity-20">
                    <div className="border-r border-b border-white/40"></div>
                    <div className="border-r border-b border-white/40"></div>
                    <div className="border-b border-white/40"></div>
                    <div className="border-r border-b border-white/40"></div>
                    <div className="border-r border-b border-white/40"></div>
                    <div className="border-b border-white/40"></div>
                    <div className="border-r border-white/40"></div>
                    <div className="border-r border-white/40"></div>
                    <div></div>
                  </div>

                  {/* Camera Corner Focus Brackets */}
                  <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white/70 dark:border-cyan-400/80 pointer-events-none" />
                  <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-white/70 dark:border-cyan-400/80 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-white/70 dark:border-cyan-400/80 pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-white/70 dark:border-cyan-400/80 pointer-events-none" />

                  {/* Pulsing Target Focus Reticle */}
                  {isAssistantScanning && !analyzing && !autoTransitioning && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full border border-dashed border-white/40 dark:border-cyan-400/60 animate-pulse" />
                      <div className="absolute w-2 h-2 rounded-full bg-cyan-400 dark:bg-cyan-500 shadow-sm" />
                    </div>
                  )}

                  {/* Scanning Horizontal Laser Beam (only during active scanning) */}
                  {isAssistantScanning && !analyzing && !autoTransitioning && (
                    <motion.div 
                      animate={{ top: ['4%', '96%', '4%'] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-4 right-4 h-[1.5px] bg-white/50 dark:bg-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.5)] pointer-events-none z-10"
                    />
                  )}

                  {/* Authentic Camera Viewfinder HUD text overlays */}
                  <div className="absolute top-4 left-8 right-8 flex justify-between pointer-events-none select-none font-mono text-[9px] tracking-wider text-white/80 mix-blend-difference">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE • {isSimulated ? "SIMULATOR" : "RAW FEED"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      AUTO-SCAN
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-8 right-8 flex justify-between pointer-events-none select-none font-mono text-[9px] tracking-wider text-white/80 mix-blend-difference">
                    <span>1080p • 60 FPS</span>
                    <span>1.0x WIDE • F/1.8</span>
                  </div>

                  {/* Cinematic Mechanical Shutter Blades - sliding open */}
                  <motion.div
                    initial={{ x: '0%' }}
                    animate={{ x: '-100%' }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 left-0 w-1/2 bg-slate-900 dark:bg-slate-950 z-20 border-r border-slate-850/20"
                  />
                  <motion.div
                    initial={{ x: '0%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 right-0 w-1/2 bg-slate-900 dark:bg-slate-950 z-20 border-l border-slate-850/20"
                  />
                  {/* Expanding Camera Iris Flare effect */}
                  <motion.div
                    initial={{ scale: 0.3, opacity: 1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute w-24 h-24 rounded-full border-2 border-white/40 dark:border-cyan-400/40 z-20 pointer-events-none"
                  />
                </div>

                {/* Elegant overlay when analyzing or auto-transitioning */}
                {(analyzing || autoTransitioning) && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-white dark:border-cyan-400 border-t-transparent border-r-transparent rounded-full"
                      />
                      <Sparkles className="w-4 h-4 text-white dark:text-cyan-400 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-bold font-mono text-white dark:text-cyan-400 tracking-wider">
                      {autoTransitioning ? 'Drafting Report...' : 'Analyzing Frame...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Simple Success / Auto-transition state alert banner */}
              {autoTransitioning && liveLockResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm text-xs text-emerald-800 dark:text-emerald-300 font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  <span>Detected {liveLockResult.category}! Navigating to Review...</span>
                </motion.div>
              )}

              {/* Fluid Soft Voice Waveform Indicator */}
              <div className="flex flex-col items-center gap-2 w-full py-2">
                <div className="flex items-center gap-1.5 h-6 justify-center">
                  {[...Array(12)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{
                        height: isAssistantScanning && !analyzing && !autoTransitioning ? [6, Math.random() * 20 + 6, 6] : 6
                      }}
                      transition={{
                        duration: 0.6 + Math.random() * 0.4,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="w-1 bg-[#0f284b] dark:bg-cyan-500 rounded-full opacity-80"
                    />
                  ))}
                </div>
                <span className="text-[8px] font-bold font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase">Interactive Voice Mode</span>
              </div>

              {/* Subtitles / Real-time Assistant transcript */}
              <div className="w-full text-center px-4">
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300">
                  <div className="flex justify-center mb-2">
                    <Volume2 className="w-4 h-4 text-[#0f284b]/60 dark:text-cyan-400/60 animate-pulse" />
                  </div>
                  <p className="text-xs md:text-sm font-medium italic leading-relaxed">
                    "{speechCaption.replace("Gemini Live Assistant:", "").trim()}"
                  </p>
                </div>
              </div>

            </div>

            {/* NERD STATS TOGGLEABLE PANEL */}
            <AnimatePresence>
              {showNerdStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden w-full flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 mb-4"
                >
                  {/* Sandbox Presets */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#0f284b] dark:text-cyan-400 animate-pulse" />
                        Sandbox Presets
                      </span>
                      <span className="text-[8px] font-mono text-slate-400">Testing Tools</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      <button 
                        onClick={() => {
                          setSimulatedPreset('none');
                          setIsSimulated(false);
                        }}
                        className={`py-2 px-3 rounded-xl border text-left flex items-center gap-1.5 transition-all ${simulatedPreset === 'none' ? 'bg-[#0f284b] border-[#0f284b] text-white font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700'}`}
                      >
                        <Camera className="w-3.5 h-3.5 shrink-0" /> Real Camera
                      </button>
                      <button 
                        onClick={() => {
                          setSimulatedPreset('pothole');
                          setIsSimulated(true);
                        }}
                        className={`py-2 px-3 rounded-xl border text-left flex items-center gap-1.5 transition-all ${simulatedPreset === 'pothole' ? 'bg-[#0f284b] border-[#0f284b] text-white font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700'}`}
                      >
                        <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" /> Pothole Preset
                      </button>
                      <button 
                        onClick={() => {
                          setSimulatedPreset('streetlight');
                          setIsSimulated(true);
                        }}
                        className={`py-2 px-3 rounded-xl border text-left flex items-center gap-1.5 transition-all ${simulatedPreset === 'streetlight' ? 'bg-[#0f284b] border-[#0f284b] text-white font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700'}`}
                      >
                        <Zap className="w-3.5 h-3.5 shrink-0 text-cyan-500" /> Streetlight Preset
                      </button>
                      <button 
                        onClick={() => {
                          setSimulatedPreset('waterleak');
                          setIsSimulated(true);
                        }}
                        className={`py-2 px-3 rounded-xl border text-left flex items-center gap-1.5 transition-all ${simulatedPreset === 'waterleak' ? 'bg-[#0f284b] border-[#0f284b] text-white font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700'}`}
                      >
                        <Zap className="w-3.5 h-3.5 shrink-0 text-blue-500" /> Sidewalk Preset
                      </button>
                    </div>
                  </div>

                  {/* Logs Terminal */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      Telemetry Logs
                    </div>
                    <div className="font-mono text-[9px] text-slate-600 dark:text-slate-400 bg-white dark:bg-black/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-col gap-1 min-h-[64px]">
                      {assistantLogs.length === 0 ? (
                        <span className="text-slate-400 italic">No telemetry events logged yet.</span>
                      ) : (
                        assistantLogs.map((log, idx) => (
                          <div key={idx} className="truncate select-none font-mono">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Standard Toolbar controls */}
            <div className="flex flex-col gap-4 w-full pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between w-full px-4">
                
                {/* Toggle Listening/Mute */}
                <button
                  onClick={() => setIsAssistantScanning(!isAssistantScanning)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isAssistantScanning ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300' : 'bg-[#0f284b]/10 text-[#0f284b] border border-[#0f284b]/20 dark:bg-cyan-500/10 dark:text-cyan-400'}`}
                  title={isAssistantScanning ? "Mute Microphone" : "Unmute Microphone"}
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Status Label */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                    {analyzing ? 'ANALYZING' : autoTransitioning ? 'COMPILING REPORT' : isAssistantScanning ? 'LISTENING LIVE' : 'MUTED'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {isSimulated ? 'Simulated Feed' : 'Camera Active'}
                  </span>
                </div>

                {/* Exit Button */}
                <button
                  onClick={() => {
                    stopCamera();
                    setReportMethod(null);
                  }}
                  className="w-12 h-12 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:border-rose-900/30 dark:text-rose-400 rounded-full flex items-center justify-center transition-all"
                  title="Exit Live Session"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              {/* Force Scan Action */}
              <div className="text-center">
                <button
                  onClick={() => {
                    if (simulatedPreset !== 'none') {
                      handlePresetScan(simulatedPreset);
                    } else {
                      handleLiveRealFrameScan();
                    }
                  }}
                  disabled={analyzing || autoTransitioning}
                  className="text-[10px] font-bold tracking-wider text-[#0f284b]/60 hover:text-[#0f284b] dark:text-slate-500 dark:hover:text-slate-300 uppercase flex items-center gap-1.5 justify-center mx-auto transition-colors py-1 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin text-[#0f284b]' : ''}`} />
                  Force Scanner Snapshot
                </button>
              </div>
            </div>

          </div>
        )
      ) : (
        /* STEP 2: CASE VERIFICATION & EDITABLE REVIEW FORM */
        <div className="p-6 flex flex-col gap-5 mt-2 max-w-[430px] mx-auto w-full">
          {/* Evidence Preview Frame */}
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[24px] relative flex items-center justify-center border border-[#e2e8f0] dark:border-slate-800 overflow-hidden shadow-sm">
            {imagePreview ? (
              <img src={imagePreview} alt="Evidence Preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-12 h-12 text-slate-400 dark:text-slate-600" />
            )}
            
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-[#e2e8f0] dark:border-slate-850">
              {analysis?.confidence === 'High' ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Ready to review</>
              ) : analysis?.confidence === 'Medium' ? (
                <><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Review recommended</>
              ) : (
                <><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Check fields</>
              )}
            </div>
          </div>

          {/* Location Map Preview */}
          <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0f284b] dark:text-cyan-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Detected Location</h3>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate max-w-[150px]">{location || 'Current Location (Demo)'}</span>
            </div>
            <div className="h-40 w-full bg-slate-100 dark:bg-slate-800 relative z-0">
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
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-[20px] flex gap-3 text-sm text-amber-900 dark:text-amber-200 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p><strong>Low Confidence Warning:</strong> We couldn't confidently extract the location or evidence quality is low. Please manually verify the details below.</p>
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900/40 rounded-[24px] overflow-hidden shadow-sm">
              <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/20 p-4 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-amber-750 dark:text-amber-400" />
                <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">Possible existing case found</h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{duplicates[0].existingCase.title}</span>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {duplicates[0].existingCase.distance}</span>
                    <span>-</span>
                    <span>{duplicates[0].existingCase.verificationCount} verifications</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 mt-2 text-xs text-slate-700 dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-800">
                    <strong>Overlap reason:</strong> {duplicates[0].reason} ({duplicates[0].score}% match)
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-1">
                  <button 
                    onClick={() => handleAttachEvidence(duplicates[0].existingCase.id)}
                    className="w-full bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-850 text-[#0f284b] dark:text-cyan-400 font-bold text-sm py-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[24px] text-xs text-red-950 dark:text-red-300 flex items-start gap-2.5 shadow-sm mt-1 mb-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5 animate-pulse" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#991b1b] dark:text-red-400">AI ESCALATION TRIGGER ARMED</span>
                <p className="text-slate-700 dark:text-slate-300 leading-normal font-medium">
                  This report matches <strong>Severity 5/5 Criteria</strong>. Submitting this issue will bypass standard Steward review and instantly fire an Automated Escalation SMS dispatch to city engineers and emergency planners.
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={confirmReport}
            className="w-full bg-[#0f284b] dark:bg-cyan-500 text-white dark:text-slate-950 font-bold text-sm py-4 mt-2 rounded-full shadow-sm hover:bg-[#1a365d] dark:hover:bg-cyan-400 transition-colors"
          >
            Submit Official Report
          </button>

          {/* Editable Fields Container */}
          <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-[24px] shadow-sm overflow-hidden flex flex-col divide-y divide-[#e2e8f0] dark:divide-slate-800">
            
            <div className="p-5 flex flex-col gap-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Title (Summary)</label>
               <input 
                 type="text" 
                 className="font-bold text-base text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0" 
                 value={analysis?.summary || ''} 
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, summary: e.target.value} : null)}
               />
            </div>

            <div className="p-5 flex flex-col gap-1 bg-[#f8f9fc] dark:bg-slate-950 border-t border-[#e2e8f0] dark:border-slate-800">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                 Objective Description <span className="text-[#0f284b] dark:text-cyan-400">De-Escalated</span>
               </label>
               <textarea 
                 className="text-sm text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none min-h-[60px] font-medium leading-relaxed" 
                 value={analysis?.objectiveDescription || ''} 
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, objectiveDescription: e.target.value} : null)}
               />
            </div>

            <div className="p-5 flex gap-4 border-t border-[#e2e8f0] dark:border-slate-800">
               <div className="flex-1 flex flex-col gap-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                 <input 
                   type="text"
                   className="text-sm font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0"
                   value={analysis?.category || ''}
                   onChange={(e) => setAnalysis(prev => prev ? {...prev, category: e.target.value} : null)}
                 />
               </div>
               <div className="flex-1 flex flex-col gap-1 border-l border-[#e2e8f0] dark:border-slate-800 pl-5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
                 <select 
                   className="text-sm font-bold text-red-600 dark:text-red-400 bg-transparent border-none outline-none focus:ring-0 p-0 appearance-none"
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

            <div className="p-5 flex flex-col gap-2 bg-[#f8f9fc] dark:bg-slate-950">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                 Missing Information <span className="text-[#0f284b] dark:text-cyan-400">AI Draft</span>
               </label>
               <textarea 
                 className="text-sm text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none min-h-[40px] font-medium leading-relaxed" 
                 value={analysis?.missingInformation?.join(', ') || 'None'} 
                 onChange={(e) => setAnalysis(prev => prev ? {...prev, missingInformation: e.target.value.split(', ')} : null)}
               />
            </div>

            <div className="p-5 grid grid-cols-2 gap-y-5 gap-x-4">
               <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Dept</label>
                 <input 
                   type="text"
                   className="text-sm font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0"
                   value={analysis?.suggestedDepartment || ''}
                   onChange={(e) => setAnalysis(prev => prev ? {...prev, suggestedDepartment: e.target.value} : null)}
                 />
               </div>
               <div className="flex flex-col gap-1 border-l border-[#e2e8f0] dark:border-slate-800 pl-5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location Confidence</label>
                 <select 
                   className="text-sm font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 appearance-none"
                   value={analysis?.locationConfidence || 'Medium'}
                   onChange={(e) => setAnalysis(prev => prev ? {...prev, locationConfidence: e.target.value as "High"|"Medium"|"Low"} : null)}
                 >
                   <option value="High">High</option>
                   <option value="Medium">Medium</option>
                   <option value="Low">Low</option>
                 </select>
               </div>
               <div className="flex flex-col gap-1 pt-5 border-t border-[#e2e8f0] dark:border-slate-800 col-span-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evidence Quality</label>
                 <select 
                   className="text-sm font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 appearance-none"
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
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto w-full bg-white dark:bg-slate-900 border-t border-[#e2e8f0] dark:border-slate-800 p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.08)] z-20">
           <button 
             onClick={confirmReport}
             className="w-full bg-[#0f284b] dark:bg-cyan-500 text-white dark:text-slate-950 font-bold text-sm py-4 rounded-full shadow-sm hover:bg-[#1a365d] dark:hover:bg-cyan-400 transition-colors"
           >
             Submit Official Report
           </button>
        </div>
      )}
    </div>
  );
}
