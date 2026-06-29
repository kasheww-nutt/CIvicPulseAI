import { useDemo } from '../context/DemoContext';
import { MissionRow } from '../components/shared/MissionRow';
import { 
  Target, 
  AlertTriangle, 
  ArrowLeft, 
  Navigation2, 
  MapPin, 
  Search, 
  Navigation, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Compass, 
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
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
    html: `<div class="w-3.5 h-3.5 ${bgColor} border-[2px] border-white rounded-full shadow-md -ml-[7px] -mt-[7px]"></div>`,
    iconSize: [0, 0]
  });
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function ChangeMapBounds({ coords, defaultCenter }: { coords: [number, number][], defaultCenter: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
    } else {
      map.setView(defaultCenter, 14);
    }
  }, [coords, defaultCenter, map]);
  return null;
}

export function Missions() {
  const { cases, verifyCase, location } = useDemo();
  const navigate = useNavigate();
  
  const [destination, setDestination] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lon: number, name: string } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeSteps, setRouteSteps] = useState<string[]>([]);
  const [routeSummary, setRouteSummary] = useState({ distance: '', duration: '', detourTime: '' });
  const [routeMissions, setRouteMissions] = useState<any[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [hasUserStartedRoute, setHasUserStartedRoute] = useState(false);
  const [routeCompletedToast, setRouteCompletedToast] = useState(false);
  const [shouldFetchSuggestions, setShouldFetchSuggestions] = useState(true);
  const [showOnlyRouteMissions, setShowOnlyRouteMissions] = useState(true);

  const [startPos, setStartPos] = useState<[number, number]>([12.9784, 77.6408]); // Default to Indiranagar, Bangalore

  // Sync starting position with user's set location in context
  useEffect(() => {
    if (location) {
      if (location.startsWith('GPS:')) {
        const coords = location.replace('GPS:', '').trim().split(',');
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lon = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lon)) {
            setStartPos([lat, lon]);
          }
        }
      } else {
        // Geocode the human-readable location string using Nominatim
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              if (!isNaN(lat) && !isNaN(lon)) {
                setStartPos([lat, lon]);
              }
            }
          })
          .catch(err => console.error("Error geocoding current location context:", err));
      }
    }
  }, [location]);

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

  // Nominatim Autocomplete Lookup
  useEffect(() => {
    if (destination.length > 2 && shouldFetchSuggestions) {
      const delayFn = setTimeout(async () => {
        setIsSearching(true);
        try {
          // Query OSM Nominatim, biasing for Bangalore region
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              destination
            )}&viewbox=77.5000,12.9000,77.7000,13.0500&bounded=0&limit=5`
          );
          const data = await res.json();
          setSuggestions(data);
        } catch (e) {
          console.error("OSM Nominatim error:", e);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(delayFn);
    } else {
      setSuggestions([]);
    }
  }, [destination, shouldFetchSuggestions]);

  const fetchRoute = async (lat: number, lon: number) => {
    setIsLoadingRoute(true);
    setRouteError(null);
    try {
      // OSRM Driving Route API
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startPos[1]},${startPos[0]};${lon},${lat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await res.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates; // [[lon, lat], ...]
        const mappedCoords: [number, number][] = coordinates.map((coord: any) => [coord[1], coord[0]]);
        setRouteCoords(mappedCoords);

        // Process route step-by-step directions
        const steps = route.legs[0].steps.map((step: any) => {
          const instr = step.maneuver.instruction || '';
          const dist = step.distance 
            ? ` (${step.distance >= 1000 ? (step.distance / 1000).toFixed(1) + ' km' : Math.round(step.distance) + ' m'})` 
            : '';
          return `${instr}${dist}`;
        }).filter((step: string) => step.length > 0);
        
        setRouteSteps(steps);

        const distKm = (route.distance / 1000).toFixed(1);
        const durMins = Math.round(route.duration / 60);
        
        setRouteSummary({
          distance: `${distKm} km`,
          duration: `${durMins} mins`,
          detourTime: `${Math.round(durMins * 0.15) || 2} min`
        });

        // Calculate missions on / near route (within ~400 meters)
        const missionsOnRoute = activeMissions.filter(c => {
          if (!c.lat || !c.lng) return false;
          const minDistance = Math.min(
            ...mappedCoords.map(coord => getDistance(c.lat!, c.lng!, coord[0], coord[1]))
          );
          return minDistance < 0.4; // 400m
        });
        
        setRouteMissions(missionsOnRoute);
        setIsRouting(true);
        setShowOnlyRouteMissions(true);
      } else {
        setRouteError("Could not calculate a route to this destination.");
      }
    } catch (err) {
      console.error("OSRM route error:", err);
      setRouteError("Failed to fetch real-time route. Please try another destination.");
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleSelectSuggestion = (sug: any) => {
    setShouldFetchSuggestions(false);
    const cleanedName = sug.display_name.split(',').slice(0, 3).join(',');
    setDestination(cleanedName);
    setSelectedLocation({
      lat: parseFloat(sug.lat),
      lon: parseFloat(sug.lon),
      name: sug.display_name
    });
    setSuggestions([]);
    fetchRoute(parseFloat(sug.lat), parseFloat(sug.lon));
  };

  const handleRouteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      fetchRoute(selectedLocation.lat, selectedLocation.lon);
    } else if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    } else if (destination.trim()) {
      setIsLoadingRoute(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            handleSelectSuggestion(data[0]);
          } else {
            setRouteError("Location not found. Please try typing a different street or place name.");
            setIsLoadingRoute(false);
          }
        })
        .catch(err => {
          console.error(err);
          setRouteError("Could not lookup this location.");
          setIsLoadingRoute(false);
        });
    }
  };

  const handleStartRoute = () => {
    setHasUserStartedRoute(true);
  };

  const handleCancelRoute = () => {
    setHasUserStartedRoute(false);
    setDestination('');
    setIsRouting(false);
    setRouteCoords([]);
    setRouteSteps([]);
    setRouteMissions([]);
    setSelectedLocation(null);
  };

  const handleFinishRoute = () => {
    setRouteCompletedToast(true);
    setHasUserStartedRoute(false);
    setIsRouting(false);
    setDestination('');
    setRouteCoords([]);
    setRouteSteps([]);
    setRouteMissions([]);
    setSelectedLocation(null);
    setTimeout(() => {
      setRouteCompletedToast(false);
    }, 6000);
  };

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-transparent min-h-screen pb-20">
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

      {/* Success Completed Toast */}
      <AnimatePresence>
        {routeCompletedToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 mx-auto max-w-sm bg-emerald-600 text-white rounded-2xl p-4 shadow-xl z-50 flex gap-3 items-start border border-emerald-500"
          >
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold block">Verification Route Completed!</strong>
              <p className="text-xs text-emerald-100/90 mt-0.5 font-medium leading-relaxed">
                Thank you for verifying issues on your path. A bonus of <strong>+10 Trust Points</strong> has been credited to your profile.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-6 flex flex-col gap-6">
        {/* Verification Routes Feature */}
        <section className="bg-white dark:bg-slate-800 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm relative">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none overflow-hidden">
            <Navigation2 className="w-24 h-24 text-blue-600" />
          </div>
          <div className="p-5 flex flex-col gap-4 relative z-10">
            <div>
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Navigation2 className="w-4 h-4 text-[#1448db] dark:text-blue-400 animate-pulse" />
                Verification Routes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Heading somewhere? Enter your destination and we'll calculate the real route and list missions along your way.
              </p>
            </div>
            
            <form onSubmit={handleRouteSearch} className="flex gap-2 relative z-30">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  {isSearching ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Where to? (e.g. Indiranagar Club)"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShouldFetchSuggestions(true);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#f8f9fc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 rounded-[12px] text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />

                {/* Autocomplete Dropdown List */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-800">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{sug.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button 
                type="submit"
                disabled={!destination.trim() || isLoadingRoute}
                className="bg-[#0f284b] dark:bg-blue-600 hover:bg-[#1a3a6c] dark:hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 text-white px-4 rounded-[12px] text-sm font-bold transition-colors shadow-sm flex items-center justify-center shrink-0 min-w-[70px]"
              >
                {isLoadingRoute ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  'Route'
                )}
              </button>
            </form>

            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-[#f8f9fc] dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 self-start">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" />
              <span>Starting from: <strong className="text-slate-800 dark:text-white">{location || 'Indiranagar, Bangalore (Default)'}</strong></span>
            </div>

            {routeError && (
              <div className="text-xs font-semibold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3 flex gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{routeError}</span>
              </div>
            )}

            <AnimatePresence>
              {isRouting && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-[16px] p-4 flex flex-col gap-3 relative z-10">
                    
                    {/* Routing metadata card */}
                    <div className="flex gap-3 items-start justify-between">
                      <div className="flex gap-3 items-start">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-full border border-blue-100 dark:border-slate-700 shadow-sm shrink-0">
                          <Compass className="w-4 h-4 text-[#1448db] dark:text-blue-400" />
                        </div>
                        <div>
                          <strong className="text-sm font-bold text-[#0f284b] dark:text-blue-300 block leading-tight">Route Optimized via OSRM!</strong>
                          <p className="text-xs text-blue-800 dark:text-blue-400 font-medium mt-1 leading-relaxed">
                            Distance: <strong className="text-[#0f284b] dark:text-blue-200">{routeSummary.distance}</strong> ({routeSummary.duration}). <br />
                            {routeMissions.length > 0 ? (
                              <span>We found <strong className="text-blue-700 dark:text-blue-300">{routeMissions.length} active report{routeMissions.length > 1 ? 's' : ''}</strong> directly along this route!</span>
                            ) : (
                              <span>No active verifications detected on this direct path.</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Cancel button */}
                      <button 
                        type="button" 
                        onClick={handleCancelRoute}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shrink-0 animate-fade-in"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Navigation State Box */}
                    {hasUserStartedRoute ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Navigation Active</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
                          Next turn: {routeSteps[0] || 'Follow the route markers on the map.'}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={handleFinishRoute}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition-colors shadow-sm"
                          >
                            Finish Trip & Claim Reward
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleStartRoute}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors w-full shadow-sm"
                      >
                        Start Navigation
                      </button>
                    )}

                    {/* Step-by-Step Directions Collapsible */}
                    {routeSteps.length > 0 && (
                      <div className="border border-blue-100/60 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => setShowDirections(!showDirections)}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-blue-500" />
                            Show Driving Directions ({routeSteps.length} steps)
                          </span>
                          {showDirections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        {showDirections && (
                          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 max-h-44 overflow-y-auto text-xs font-semibold text-slate-600 dark:text-slate-400 divide-y divide-slate-100 dark:divide-slate-800/60">
                            {routeSteps.map((step, idx) => (
                              <div key={idx} className="py-2 flex items-start gap-2 first:pt-0 last:pb-0">
                                <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">{idx + 1}.</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active Leaflet Map */}
                    <div className="h-48 w-full rounded-[12px] overflow-hidden border border-blue-200 dark:border-slate-700 z-0">
                      <MapContainer 
                        center={startPos} 
                        zoom={14} 
                        scrollWheelZoom={true} 
                        zoomControl={true}
                        className="w-full h-full z-0"
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={startPos} icon={userIcon} />
                        {selectedLocation && (
                          <Marker position={[selectedLocation.lat, selectedLocation.lon]} icon={destinationIcon} />
                        )}
                        {routeMissions.map(m => {
                          if (!m.lat || !m.lng) return null;
                          return (
                            <Marker 
                              key={m.id} 
                              position={[m.lat, m.lng]} 
                              icon={getSeverityIcon(m.severity)} 
                            />
                          );
                        })}
                        {routeCoords.length > 0 && (
                          <Polyline positions={routeCoords} color="#2563eb" weight={4} />
                        )}
                        <ChangeMapBounds coords={routeCoords} defaultCenter={startPos} />
                      </MapContainer>
                    </div>

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

        {/* Missions Lists Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isRouting && showOnlyRouteMissions ? 'Missions Along Route' : 'Nearby Active Cases'}
              </h2>
              {isRouting && (
                <button
                  type="button"
                  onClick={() => setShowOnlyRouteMissions(!showOnlyRouteMissions)}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline text-left mt-0.5"
                >
                  {showOnlyRouteMissions ? 'Show all nearby cases' : 'Filter by my route'}
                </button>
              )}
            </div>
            <span className="text-[10px] font-bold text-[#0f284b] dark:text-blue-300 bg-slate-100 dark:bg-blue-900/30 px-2 py-1 rounded-full border border-[#e2e8f0] dark:border-slate-700 shrink-0">+5 Trust</span>
          </div>
          
          <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[24px] overflow-hidden shadow-sm flex flex-col">
            {isRouting && showOnlyRouteMissions ? (
              routeMissions.length > 0 ? (
                routeMissions.map(c => (
                  <MissionRow 
                    key={c.id} 
                    item={c} 
                    onVerify={() => verifyCase(c.id, 'verify')} 
                  />
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm font-medium flex flex-col items-center gap-2">
                  <p>No active reports detected along this exact route path.</p>
                  <button
                    type="button"
                    onClick={() => setShowOnlyRouteMissions(false)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                  >
                    View other nearby active cases
                  </button>
                </div>
              )
            ) : activeMissions.length > 0 ? (
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
               <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30 shrink-0">+12 Trust</span>
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
  );
}
