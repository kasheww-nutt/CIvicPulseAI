import { useEffect, useState, useRef } from 'react';
import { useDemo } from '../../context/DemoContext';
import { CivicCase } from '../../types';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; // in metres
  return d;
}

export function GeofenceWatcher() {
  const { cases } = useDemo();
  const [nearbyCase, setNearbyCase] = useState<CivicCase | null>(null);
  const navigate = useNavigate();
  const notifiedCases = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Find the first unverified case within 50m that we haven't notified about yet
        const targetCase = cases.find(c => {
          if (!c.lat || !c.lng) return false;
          if (c.verifiedByMe || c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Fix Verified') return false;
          
          const dist = calculateDistance(latitude, longitude, c.lat, c.lng);
          return dist <= 50 && !notifiedCases.current.has(c.id);
        });

        if (targetCase) {
          setNearbyCase(targetCase);
          notifiedCases.current.add(targetCase.id);

          // Try PWA Push Notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
             try {
               new Notification(`Near a ${targetCase.category}.`, {
                  body: "Is it still there? Tap to verify.",
                  icon: "/icon.png"
               });
             } catch (e) {
               console.warn('Push notification failed', e);
             }
          }
        }
      },
      (error) => {
        if (error.code !== 1) { // 1 is PERMISSION_DENIED
          console.warn(`Geolocation error: ${error.message} (Code: ${error.code})`);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    // Request notification permission if not asked yet
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.warn);
    }

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [cases]);

  if (!nearbyCase) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto bg-white rounded-xl shadow-2xl border-2 border-[#1448db] p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-full text-[#1448db] flex-shrink-0">
          <MapPin className="w-6 h-6 animate-bounce" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">Near a {nearbyCase.category}</h3>
          <p className="text-sm text-slate-600 mt-1">You are within 50m of a reported issue. Is it still there?</p>
          <div className="flex gap-2 mt-3">
             <button 
               onClick={() => {
                 setNearbyCase(null);
                 navigate(`/case/${nearbyCase.id}`);
               }}
               className="flex-1 bg-[#1448db] text-white py-2 rounded-lg font-bold text-sm hover:bg-[#0f36a8]"
             >
               Yes
             </button>
             <button 
               onClick={() => setNearbyCase(null)}
               className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-200"
             >
               No
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
