import React, { useState, useMemo, useEffect } from 'react';
import { useDemo } from '../context/DemoContext';
import { cn } from '../lib/utils';
import { MissionRow } from '../components/shared/MissionRow';
import { MapPin, Navigation, Map as MapIcon, ShieldCheck, CheckCircle2, Award, ArrowRight, Plus, Minus, Maximize, Minimize, Menu, Bell, Search, MoreVertical, FileText, ChevronDown, UserCircle, TrendingUp, ExternalLink, RefreshCw, ClipboardList, FileBox, CreditCard, BellRing, Moon, Sun, ArrowLeft, Shield, LayoutDashboard, Mail, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { NotificationBell } from '../components/shared/NotificationBell';
import { RoleAuthModal } from '../components/shared/RoleAuthModal';

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const currentCenter = map.getCenter();
    const targetCenter = L.latLng(center[0], center[1]);
    const distance = currentCenter.distanceTo(targetCenter);
    
    // If distance is greater than 50km, jump directly to avoid long animations
    if (distance > 50000) {
      map.setView(center, map.getZoom(), { animate: false });
    } else {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function MapControls({ center, isFullscreen, onToggleFullscreen }: { center: [number, number], isFullscreen: boolean, onToggleFullscreen: () => void }) {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleRecenter = () => map.flyTo(center, 13);
  
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [isFullscreen, map]);

  return (
    <div className={cn("absolute right-2 flex flex-col gap-1.5 z-[1000] pointer-events-auto transition-all duration-300", isFullscreen ? "top-28" : "top-2")}>
      <div className="flex flex-col bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button onClick={handleZoomIn} className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700" title="Zoom In">
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleZoomOut} className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700" title="Zoom Out">
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
      <button onClick={handleRecenter} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-1.5 rounded shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700" title="Recenter">
        <Navigation className="w-3.5 h-3.5" />
      </button>
      <button onClick={onToggleFullscreen} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-1.5 rounded shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700" title="Toggle Fullscreen">
        {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// Custom icons for leaflet to avoid broken default image paths in Vite
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div class="relative w-12 h-12 flex items-center justify-center -ml-6 -mt-6">
          <div class="absolute w-full h-full bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-blue-600 border-[3px] border-white rounded-full shadow-md"></div>
        </div>`,
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
    html: `<div class="w-4 h-4 ${bgColor} border-[3px] border-white rounded-full shadow-md -ml-2 -mt-2"></div>`,
    iconSize: [0, 0]
  });
};

export function CitizenHome() {
  const { cases, location, setLocation, verifyCase, trustScore, userRole, setRole, isDarkMode, toggleDarkMode } = useDemo();
  const { signOut, user, dbRole } = useAuth();
  const navigate = useNavigate();
  
  const canBeAdmin = dbRole === 'admin';
  const canBeSteward = dbRole === 'admin' || dbRole === 'steward';

  const [showLocationPrompt, setShowLocationPrompt] = useState(!location);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualLocationText, setManualLocationText] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGPSLoading, setIsGPSLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9784, 77.6408]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<'steward' | 'admin' | null>(null);

  useEffect(() => {
    if (manualLocationText.length > 2 && isManualInput) {
      const delayFn = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationText)}&limit=5`);
          const data = await res.json();
          setSuggestions(data);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(delayFn);
    } else {
      setSuggestions([]);
    }
  }, [manualLocationText, isManualInput]);

  const priorityCases = useMemo(() => cases
    .filter(c => c.status !== 'Resolved' && c.status !== 'Fix Verified')
    .sort((a, b) => {
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
    })
    .slice(0, 4), [cases]);

  const mapCases = useMemo(() => {
    const hash = Math.floor(Math.abs(mapCenter[0] + mapCenter[1]) * 10000);
    const validCases = cases.filter(c => c.lat && c.lng);
    
    // Separate mock cases and user-reported cases
    const userCases = validCases.filter(c => c.id.startsWith('c-'));
    const mockCases = validCases.filter(c => !c.id.startsWith('c-'));

    const shuffledMockCases = [...mockCases].sort((a, b) => {
      const hashA = (hash * a.id.charCodeAt(0)) % 100;
      const hashB = (hash * b.id.charCodeAt(0)) % 100;
      return hashA - hashB;
    });
    
    const transformedMocks = shuffledMockCases.slice(0, 6).map((c, idx) => {
      const latOffset = (idx % 3 - 1) * 0.005 + (((hash + idx) % 20) - 10) * 0.0002;
      const lngOffset = (idx % 2 - 0.5) * 0.005 + (((hash + idx + 5) % 20) - 10) * 0.0002;
      return {
        ...c,
        lat: mapCenter[0] + latOffset,
        lng: mapCenter[1] + lngOffset
      };
    });

    return [...userCases, ...transformedMocks];
  }, [cases, mapCenter]);

  const needsVerificationCount = mapCases.filter(c => c.status === 'Reported' || c.status === 'AI Analyzed').length;

  const handleUseLocation = () => {
    setIsGPSLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setMapCenter([lat, lon]);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const name = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            setLocation(name);
            setShowLocationPrompt(false);
          } catch(e) {
            setLocation(`GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            setShowLocationPrompt(false);
          } finally {
            setIsGPSLoading(false);
          }
        },
        () => {
          setIsGPSLoading(false);
          setIsManualInput(true); // Fallback to manual if GPS fails
        },
        { timeout: 5000 }
      );
    } else {
      setIsGPSLoading(false);
      setIsManualInput(true);
    }
  };

  const handleManualLocation = () => {
    setIsManualInput(true);
  };

  const handleSelectSuggestion = (sug: any) => {
    setLocation(sug.display_name.split(',').slice(0, 3).join(','));
    if (sug.lat && sug.lon) {
      setMapCenter([parseFloat(sug.lat), parseFloat(sug.lon)]);
    }
    setShowLocationPrompt(false);
    setIsManualInput(false);
    setSuggestions([]);
    setManualLocationText('');
  };

  const submitManualLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualLocationText.trim()) {
      setLocation(manualLocationText.trim());
      setShowLocationPrompt(false);
      setIsManualInput(false);
    }
  };

  const getProgress = (status: string) => {
    switch(status) {
      case 'Reported': return 20;
      case 'AI Analyzed': return 40;
      case 'Verified': return 60;
      case 'Assigned': return 80;
      case 'Resolved': return 100;
      case 'Fix Verified': return 100;
      default: return 10;
    }
  };

  const [showMenu, setShowMenu] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState<string>('just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000);
      if (diff === 0) setTimeAgo('just now');
      else if (diff === 1) setTimeAgo('1 min ago');
      else setTimeAgo(`${diff} mins ago`);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setTimeAgo('just now');
      setIsRefreshing(false);
    }, 600); // fake delay for animation
  };

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-transparent min-h-screen font-sans relative w-full overflow-x-hidden">
      {/* City Background Image */}
      <div 
        className="absolute top-0 left-0 right-0 h-[280px] pointer-events-none z-0 dark:invert dark:hue-rotate-180 dark:opacity-[0.35] transition-all duration-300" 
        style={{
          backgroundImage: `url("/top-bg.png")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top',
          backgroundSize: '100% auto'
        }}
      />

      {/* Top Bar matching mockup */}
      <div className={cn("flex items-center justify-between gap-2 px-4 sm:px-6 pb-2 transition-all duration-300 left-0 right-0 top-0", isFullscreen ? "fixed z-[1001] pt-6 bg-transparent max-w-[430px] mx-auto" : "relative z-50 pt-3")}>
        <div className="relative shrink-0">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowMenu(!showMenu); setShowLocationPrompt(false); }}
            className="text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[20px] shadow-lg z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {/* User Info Header block */}
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 shrink-0 shadow-sm">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserCircle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.displayName || 'Guest Citizen'}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate tracking-wide">{user?.email || 'guest@civicpulse.ai'}</span>
                  </div>
                </div>

                <div className="p-2 flex flex-col">
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <UserCircle className="w-4 h-4 shrink-0" />
                    )}
                    My Profile
                  </Link>
                  <Link to="/cases" className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                    <FileText className="w-4 h-4" /> My Reports
                  </Link>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                  {userRole !== 'citizen' && (
                    <button 
                      onClick={() => { setRole('citizen'); setShowMenu(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-left w-full"
                    >
                      <UserCircle className="w-4 h-4 text-blue-500" /> Switch to Citizen
                    </button>
                  )}
                  {userRole !== 'steward' && (
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        if (canBeSteward) {
                          setRole('steward');
                          navigate('/dashboard');
                        } else {
                          setAuthModalRole('steward');
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-left w-full"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Switch to Steward
                    </button>
                  )}
                  {userRole !== 'admin' && (
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        if (canBeAdmin) {
                          setRole('admin');
                          navigate('/dashboard');
                        } else {
                          setAuthModalRole('admin');
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-left w-full"
                    >
                      <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" /> Switch to Admin
                    </button>
                  )}
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                  <button 
                    onClick={async () => {
                      try {
                        await signOut();
                        navigate('/login');
                      } catch (e) {
                        console.error('Failed to log out');
                      }
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative flex-1 flex justify-center max-w-[200px]">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowLocationPrompt(!showLocationPrompt); setShowMenu(false); }}
            className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 hover:text-slate-600 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm max-w-full"
          >
            <MapPin className="w-4 h-4 shrink-0 text-slate-700 dark:text-slate-400" />
            <span className="font-bold text-[13px] sm:text-[15px] truncate">{!location || location === 'Unknown Location' ? 'Set Location' : location.split(',')[0]}</span>
            <ChevronDown className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
          </motion.button>
          
          {showLocationPrompt && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] sm:w-[300px] bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[20px] p-4 shadow-lg z-[100]">
              {isManualInput ? (
                <form onSubmit={submitManualLocation} className="flex flex-col gap-3 relative">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Enter your area manually.</p>
                    <button type="button" onClick={() => setIsManualInput(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><Minus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={manualLocationText}
                      onChange={(e) => setManualLocationText(e.target.value)}
                      placeholder="e.g., Indiranagar" 
                      className="flex-1 border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button type="submit" className="bg-[#0f284b] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                      Set
                    </button>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectSuggestion(sug)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 truncate"
                        >
                          {sug.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Set your location to find nearby missions.</p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={isGPSLoading} onClick={handleUseLocation} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                      <Navigation className={`w-4 h-4 ${isGPSLoading ? 'animate-pulse' : ''}`} /> {isGPSLoading ? 'Locating...' : 'GPS'}
                    </button>
                    <button onClick={handleManualLocation} className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                      <MapIcon className="w-4 h-4" /> Manual
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDarkMode}
            className="text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          <NotificationBell buttonClassName="text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm relative" />
        </div>
      </div>

      {/* Greeting */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-5 px-5 py-4 mb-4 mt-2 relative z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-800/60 rounded-[24px] shadow-sm"
      >
        <h1 className="text-[26px] font-black text-[#0f284b] dark:text-white tracking-tight leading-tight">Hi Citizen!</h1>
        <p className="text-slate-600 dark:text-slate-300 text-[13px] font-medium mt-1">Good Morning ☀️</p>
      </motion.div>

      {/* Passive Geofence Drive-by Opportunity */}
      {cases.some(c => c.bounty && c.proofLadderStage < 2) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="px-4 mb-5 relative z-10"
        >
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 border border-emerald-200 dark:border-emerald-700 rounded-[20px] p-4 flex gap-3 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <MapPin className="w-24 h-24 text-emerald-900 dark:text-emerald-100" />
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-700">
              <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-emerald-400 opacity-20"></span>
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 relative" />
            </div>
            <div className="flex flex-col gap-1.5 relative z-10">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[13px] text-slate-900 dark:text-white">Nearby Bounty Detected</h4>
                <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Live</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                You're within 50m of a reported issue with a <strong>${cases.find(c => c.bounty && c.proofLadderStage < 2)?.bounty?.amount.toFixed(2)} bounty</strong>. Verify it now!
              </p>
              <button onClick={() => navigate(`/case/${cases.find(c => c.bounty && c.proofLadderStage < 2)?.id}`)} className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors px-4 py-2 rounded-full w-fit mt-1 shadow-sm">
                Verify & Earn
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-3 mb-6 relative z-10"
      >
        <div className="relative w-full rounded-[20px] shadow-sm">
          <img src="/card-bg.png" alt="Report, Track, Improve" className="w-full h-auto block rounded-[20px] dark:brightness-[0.82] transition-all duration-300" />
          <div className="absolute inset-0 p-4 sm:p-5 flex flex-col keep-original-color">
            <div className="max-w-[65%] sm:max-w-[280px]">
              <h2 className="text-[16.5px] sm:text-[18px] font-bold leading-tight mb-1 text-white mt-4 sm:mt-5">Report. Track. Improve your community.</h2>
              <p className="text-[10px] sm:text-[10.5px] text-blue-50/90 leading-snug font-medium max-w-[85%] sm:max-w-[160px] mt-2 sm:mt-3">Report issues, track progress and help build a better place for everyone.</p>
            </div>

            <Link to="/report" className="bg-white dark:bg-slate-800 text-[#0f284b] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-[8px] sm:rounded-[10px] font-bold text-[10.5px] sm:text-[11.5px] flex items-center justify-center gap-1.5 self-start w-fit whitespace-nowrap shadow-sm mt-3 sm:mt-4">
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-500" /> Report an Issue <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Live Map Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn("px-3 mb-6 relative", isFullscreen ? "z-[1000]" : "z-10")}
      >
        <div className="bg-white dark:bg-slate-800 rounded-[24px] p-2 sm:p-3 border border-[#e2e8f0] dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-2 px-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-blue-500" />
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">Live Map</h2>
            </div>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-600 py-1.5 px-3 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              {isFullscreen ? 'Close Full' : 'View Full'} <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          
          <div className={isFullscreen 
            ? "fixed inset-0 z-[1000] w-full max-w-[430px] mx-auto bg-white dark:bg-slate-900 flex flex-col" 
            : "rounded-[16px] overflow-hidden border border-[#e2e8f0] dark:border-slate-700 h-[170px] relative z-0"}>
            
            <MapContainer 
              center={mapCenter} 
              zoom={14} 
              scrollWheelZoom={isFullscreen} 
              zoomControl={false}
              className={isFullscreen ? "flex-1 w-full relative z-0" : "w-full h-full z-0"}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <MapUpdater center={mapCenter} />
              <Marker position={mapCenter} icon={userIcon} />
              
              {mapCases.map(c => (
                c.lat && c.lng && (
                  <Marker key={c.id} position={[c.lat, c.lng]} icon={getSeverityIcon(c.severity)}>
                    <Popup>
                      <div className="text-xs font-bold">{c.title}</div>
                    </Popup>
                  </Marker>
                )
              ))}
              <MapControls center={mapCenter} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(!isFullscreen)} />
            </MapContainer>
          </div>

          <div className="bg-[#f8f9fc] rounded-[16px] border border-[#e2e8f0] mt-2 p-2 flex justify-between items-center gap-1 overflow-x-auto hide-scrollbar">
            <div className="flex flex-col items-center flex-1 min-w-[50px]">
               <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex items-center justify-center shrink-0"><div className="w-1 h-1 bg-white rounded-full"></div></div>
                  <span className="text-[10px] font-medium text-slate-600 leading-tight">Open</span>
               </div>
               <span className="text-[14px] font-bold text-slate-900 leading-none">12</span>
            </div>
            <div className="w-px h-6 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center flex-1 min-w-[65px]">
               <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex items-center justify-center shrink-0"><div className="w-1 h-1 bg-white rounded-full"></div></div>
                  <span className="text-[10px] font-medium text-slate-600 leading-tight whitespace-nowrap">In Progress</span>
               </div>
               <span className="text-[14px] font-bold text-slate-900 leading-none">8</span>
            </div>
            <div className="w-px h-6 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center flex-1 min-w-[55px]">
               <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex items-center justify-center shrink-0"><div className="w-1 h-1 bg-white rounded-full"></div></div>
                  <span className="text-[10px] font-medium text-slate-600 leading-tight">Resolved</span>
               </div>
               <span className="text-[14px] font-bold text-slate-900 leading-none">34</span>
            </div>
            <div className="w-px h-6 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center flex-1 min-w-[50px]">
               <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><CheckCircle2 className="w-1.5 h-1.5 text-white" /></div>
                  <span className="text-[10px] font-medium text-slate-600 leading-tight">Closed</span>
               </div>
               <span className="text-[14px] font-bold text-slate-900 leading-none">120</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2.5 px-1">
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-500 font-medium">Last updated {timeAgo}</span>
             </div>
             <button onClick={handleRefresh} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
             </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Links Bento */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-3 relative z-10"
      >
        <div className="grid grid-cols-4 gap-3 pb-2">
           
           <Link to="/cases" className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[16px] p-2 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow aspect-square gap-1.5">
             <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-[10px] flex items-center justify-center shrink-0">
                <ClipboardList className="w-4.5 h-4.5" />
             </div>
             <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-none">Tasks</h3>
           </Link>

           <Link to="/cases" className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[16px] p-2 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow aspect-square gap-1.5">
             <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-[10px] flex items-center justify-center shrink-0">
                <FileBox className="w-4.5 h-4.5" />
             </div>
             <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-none">Reports</h3>
           </Link>

           <Link to="/missions" className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[16px] p-2 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow aspect-square gap-1.5">
             <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-[10px] flex items-center justify-center shrink-0">
                <CreditCard className="w-4.5 h-4.5" />
             </div>
             <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-none">Payments</h3>
           </Link>

           <button className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[16px] p-2 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow aspect-square gap-1.5 w-full">
             <div className="w-9 h-9 bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 rounded-[10px] flex items-center justify-center shrink-0">
                <BellRing className="w-4.5 h-4.5" />
             </div>
             <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-none">Notices</h3>
           </button>
        </div>
      </motion.div>
      <RoleAuthModal 
        isOpen={authModalRole !== null}
        onClose={() => setAuthModalRole(null)}
        role={authModalRole || 'steward'}
      />
    </div>
  );
}