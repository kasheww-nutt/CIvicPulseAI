import { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { MissionRow } from '../components/shared/MissionRow';
import { MapPin, Navigation, Map, ShieldCheck, CheckCircle2, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CitizenHome() {
  const { cases, location, setLocation, verifyCase, trustScore } = useDemo();
  const navigate = useNavigate();
  
  const [showLocationPrompt, setShowLocationPrompt] = useState(!location);

  const priorityCases = cases
    .filter(c => c.status !== 'Resolved' && c.status !== 'Fix Verified')
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 4);

  const handleUseLocation = () => {
    setLocation('Indiranagar, Demo Area');
    setShowLocationPrompt(false);
  };

  const handleManualLocation = () => {
    setLocation('Indiranagar, Demo Area');
    setShowLocationPrompt(false);
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      
      {/* 1. Area + Location Confidence */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        {showLocationPrompt ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600 font-medium leading-snug">Allow location access to find nearby civic missions.</p>
            <div className="flex gap-2">
              <button onClick={handleUseLocation} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                <Navigation className="w-4 h-4" /> GPS
              </button>
              <button onClick={handleManualLocation} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                <Map className="w-4 h-4" /> Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Area</span>
                <span className="text-sm font-bold text-slate-900">{location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded uppercase tracking-wider border border-green-200">GPS High</span>
              <button onClick={() => setShowLocationPrompt(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Edit</button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Map Preview (Placeholder) */}
      <div className="w-full h-48 bg-slate-100 relative overflow-hidden border-b border-slate-200 flex items-center justify-center">
        {/* Realistic CSS Map Base */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0),
            linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }} />
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'linear-gradient(to right, #94a3b8 2px, transparent 2px), linear-gradient(to bottom, #94a3b8 2px, transparent 2px)', 
          backgroundSize: '100px 100px' 
        }} />
        <div className="absolute inset-0 opacity-50 bg-gradient-to-t from-slate-200/80 to-transparent" />
        
        {/* Confidence/Radius Ring */}
        <div className="absolute w-32 h-32 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full" />
        </div>
        
        {/* Location Radar Indicator */}
        <div className="relative w-12 h-12 flex items-center justify-center z-10">
          <div className="absolute w-full h-full bg-blue-500/30 rounded-full animate-ping" />
          <div className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md" />
        </div>
        
        {/* Fake Pins */}
        <div className="absolute top-1/4 left-1/4 w-2.5 h-2.5 bg-red-500 border border-white rounded-full shadow-sm" />
        <div className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-orange-500 border border-white rounded-full shadow-sm" />
        <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-red-500 border border-white rounded-full shadow-sm opacity-50" />
        
        {/* Recenter Control */}
        <button className="absolute top-3 right-3 bg-white p-2 rounded-md shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 z-10">
          <Navigation className="w-4 h-4" />
        </button>
        
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200 text-[10px] font-semibold text-slate-700 flex items-center gap-1.5 z-10">
          <span className="w-2 h-2 rounded-full bg-red-500" /> {priorityCases.length} nearby cases
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6">
        
        {/* 4. Civic Trust Strip & Local Impact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-teal-700 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Civic Trust</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{trustScore}</span>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1 rounded">+12 wk</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-teal-500 h-full w-2/3 rounded-full" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Reliable Citizen</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
             <div className="flex items-center gap-1.5 text-blue-700 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Community</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Verified</span>
                <span className="font-bold text-slate-900">24</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Resolved</span>
                <span className="font-bold text-slate-900">12</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Priority Mission Queue */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1 px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              Priority Missions
            </h2>
            <button onClick={() => navigate('/missions')} className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
              See All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {priorityCases.length > 0 ? (
              priorityCases.map(c => (
                <MissionRow 
                  key={c.id} 
                  item={c} 
                  onVerify={() => verifyCase(c.id, 'verify')}
                  compact={true}
                />
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm font-medium bg-slate-50">
                No urgent missions nearby right now.
              </div>
            )}
          </div>
        </section>

        {/* 6. Recent Activity */}
        <section className="mt-2 pb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">Recent Activity</h2>
          <div className="flex flex-col gap-2">
            <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
               <span className="text-xs font-medium text-slate-700">Verified Water leakage</span>
               <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">+5</span>
            </div>
            <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
               <span className="text-xs font-medium text-slate-700">Marked Duplicate Pothole</span>
               <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">+8</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

