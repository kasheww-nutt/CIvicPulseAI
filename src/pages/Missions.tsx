import { useDemo } from '../context/DemoContext';
import { MissionRow } from '../components/shared/MissionRow';
import { Target, AlertTriangle, ArrowLeft, Navigation2, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div class="relative w-8 h-8 flex items-center justify-center -ml-4 -mt-4">
          <div class="absolute w-full h-full bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="w-3 h-3 bg-blue-600 border-[2px] border-white rounded-full shadow-md"></div>
        </div>`,
  iconSize: [0, 0]
});

const destinationIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `<div class="w-4 h-4 bg-slate-800 border-[2px] border-white rounded-full shadow-md -ml-2 -mt-2"></div>`,
  iconSize: [0, 0]
});

const getSeverityIcon = (severity: number) => {
  let bgColor = 'bg-slate-500';
  if (severity >= 5) bgColor = 'bg-red-500';
  else if (severity === 4) bgColor = 'bg-orange-500';
  else if (severity === 3) bgColor = 'bg-amber-500';
  else bgColor = 'bg-blue-500';

  return L.divIcon({
    className: 'custom-severity-marker',
    html: `<div class="w-3 h-3 ${bgColor} border-[2px] border-white rounded-full shadow-md -ml-1.5 -mt-1.5"></div>`,
    iconSize: [0, 0]
  });
};

export function Missions() {
  const { cases, verifyCase, location } = useDemo();
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [isRouting, setIsRouting] = useState(false);

  const activeMissions = cases.filter(c => c.status !== 'Resolved' && c.status !== 'Fix Verified').sort((a, b) => {
    let scoreA = a.severity * 10;
    if (a.duplicateRisk === 'High') scoreA += 15;
    if (a.evidenceQuality === 'Low') scoreA += 10;
    if (a.locationSource === 'Manual pin') scoreA += 5;
    scoreA -= a.verificationCount;

    let scoreB = b.severity * 10;
    if (b.duplicateRisk === 'High') scoreB += 15;
    if (b.evidenceQuality === 'Low') scoreB += 10;
    if (b.locationSource === 'Manual pin') scoreB += 5;
    scoreB -= b.verificationCount;

    return scoreB - scoreA;
  });
  const resolvedMissions = cases.filter(c => c.status === 'Resolved');

  const handleRouteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      setIsRouting(true);
    }
  };

  // Mock route coordinates
  const startPos: [number, number] = [12.9784, 77.6408];
  const endPos: [number, number] = [12.9820, 77.6450];
  const detour1: [number, number] = [12.9800, 77.6430];
  const detour2: [number, number] = [12.9810, 77.6420];

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-transparent min-h-screen">
      <header className="bg-white dark:bg-slate-900 px-6 pt-6 pb-4 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-[#e2e8f0] dark:border-slate-700 shrink-0">
             <Target className="w-4 h-4 text-[#0f284b] dark:text-blue-400" />
           </div>
           <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Nearby Missions</h1>
        </div>
      </header>

      <div className="p-4 sm:p-6 flex flex-col gap-6">
        {/* Verification Routes Feature */}
        <section className="bg-white dark:bg-slate-800 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <Navigation2 className="w-24 h-24 text-blue-600" />
          </div>
          <div className="p-5 flex flex-col gap-4 relative z-10">
            <div>
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Navigation2 className="w-4 h-4 text-[#1448db] dark:text-blue-400" />
                Verification Routes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Heading somewhere? Enter your destination and we'll find missions along your way with minimal detour.
              </p>
            </div>
            
            <form onSubmit={handleRouteSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Where to? (e.g. Coffee shop)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#f8f9fc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 rounded-[12px] text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={!destination.trim()}
                className="bg-[#0f284b] dark:bg-blue-600 hover:bg-[#1a3a6c] dark:hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 text-white px-4 rounded-[12px] text-sm font-bold transition-colors shadow-sm flex items-center justify-center shrink-0"
              >
                Route
              </button>
            </form>

            <AnimatePresence>
              {isRouting && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-[16px] p-4 flex flex-col gap-3">
                    <div className="flex gap-3 items-start">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-full border border-blue-100 dark:border-slate-700 shadow-sm shrink-0">
                        <MapPin className="w-4 h-4 text-[#1448db] dark:text-blue-400" />
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-[#0f284b] dark:text-blue-300 block leading-tight">Route optimized!</strong>
                        <p className="text-xs text-blue-800 dark:text-blue-400 font-medium mt-0.5 leading-relaxed">
                          If you take a <strong>2-minute detour</strong> down 5th Street, you can verify <strong>2 high-priority reports</strong> along the way.
                        </p>
                      </div>
                    </div>

                    <div className="h-32 w-full rounded-[12px] overflow-hidden border border-blue-200 dark:border-slate-700 z-0">
                      <MapContainer 
                        center={startPos} 
                        zoom={14} 
                        scrollWheelZoom={false} 
                        zoomControl={false}
                        className="w-full h-full z-0"
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={startPos} icon={userIcon} />
                        <Marker position={endPos} icon={destinationIcon} />
                        <Marker position={detour1} icon={getSeverityIcon(5)} />
                        <Marker position={detour2} icon={getSeverityIcon(4)} />
                        {/* Direct path */}
                        <Polyline positions={[startPos, endPos]} color="#94a3b8" dashArray="5, 10" weight={2} />
                        {/* Detour path */}
                        <Polyline positions={[startPos, detour1, detour2, endPos]} color="#2563eb" weight={3} />
                      </MapContainer>
                    </div>

                    <button 
                      type="button"
                      className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-[#1448db] dark:text-blue-400 font-bold text-xs py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors w-full shadow-sm"
                      onClick={() => {
                        setDestination('');
                        setIsRouting(false);
                      }}
                    >
                      Start Route
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-[20px] p-4 flex gap-3 text-sm text-amber-900 dark:text-amber-300 items-start shadow-sm">
           <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
           <div className="flex flex-col gap-0.5">
             <strong className="font-bold text-amber-900 dark:text-amber-300 text-sm">Safety First</strong>
             <p className="text-amber-800 dark:text-amber-400/80 leading-snug text-xs font-medium">Do not enter unsafe or restricted areas. Observe from a safe distance.</p>
           </div>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Cases
            </h2>
            <span className="text-[10px] font-bold text-[#0f284b] dark:text-blue-300 bg-slate-100 dark:bg-blue-900/30 px-2 py-1 rounded-full border border-[#e2e8f0] dark:border-blue-800/30">+5 Trust</span>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[24px] overflow-hidden shadow-sm flex flex-col">
            {activeMissions.length > 0 ? (
              activeMissions.map(c => (
                <MissionRow 
                  key={c.id} 
                  item={c} 
                  onVerify={() => verifyCase(c.id, 'verify')} 
                />
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                 No active missions nearby right now.
              </div>
            )}
          </div>
        </section>

        {resolvedMissions.length > 0 && (
           <section className="flex flex-col gap-3 mt-2">
             <div className="flex items-center justify-between px-2 mb-1">
               <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                 Confirm Fixed
               </h2>
               <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30">+12 Trust</span>
             </div>
             <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[24px] overflow-hidden shadow-sm flex flex-col">
               {resolvedMissions.map(c => (
                 <MissionRow 
                   key={c.id} 
                   item={c} 
                   onVerify={() => verifyCase(c.id, 'fixed')} 
                 />
               ))}
             </div>
           </section>
        )}
      </div>
    </div>
  )
}

