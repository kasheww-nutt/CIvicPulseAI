import { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { CaseCard } from '../components/shared/CaseCard';
import { Button } from '../components/ui/Button';
import { MapPin, Navigation, Map, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CitizenHome() {
  const { cases, location, setLocation, verifyCase, userRole, setRole } = useDemo();
  const navigate = useNavigate();
  
  const [showLocationPrompt, setShowLocationPrompt] = useState(!location);

  const priorityCases = cases
    .filter(c => c.status !== 'Resolved' && c.status !== 'Fix Verified')
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  const handleUseLocation = () => {
    setLocation('Indiranagar, Demo Area');
    setShowLocationPrompt(false);
  };

  const handleManualLocation = () => {
    setLocation('Indiranagar, Demo Area');
    setShowLocationPrompt(false);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-3xl mx-auto">
      <header className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Good morning, Asha.</h1>
            <Button variant="ghost" size="sm" onClick={() => setRole(userRole === 'admin' ? 'citizen' : 'admin')} className="text-xs text-slate-400">
              Toggle Admin
            </Button>
        </div>
        <p className="text-slate-600">Your community relies on you to help identify and verify local civic issues.</p>
      </header>

      {/* Location Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {showLocationPrompt ? (
           <div className="flex flex-col gap-3 w-full">
             <div className="flex gap-2 items-start text-sm text-slate-600">
               <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
               <p>Allow location access to find nearby civic cases, or set a manual area.</p>
             </div>
             <div className="flex flex-col sm:flex-row gap-2 w-full mt-1">
               <Button onClick={handleUseLocation} className="flex-1 gap-2"><Navigation className="w-4 h-4"/> Use my location</Button>
               <Button onClick={handleManualLocation} variant="outline" className="flex-1 gap-2"><Map className="w-4 h-4"/> Choose area manually</Button>
             </div>
           </div>
        ) : (
           <div className="flex items-center justify-between w-full">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                 <MapPin className="w-5 h-5 text-blue-600" />
               </div>
               <div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Area</p>
                 <p className="font-semibold text-slate-900 text-sm md:text-base">{location}</p>
               </div>
             </div>
             <Button variant="outline" size="sm" onClick={() => setShowLocationPrompt(true)} className="text-slate-600 text-xs">Change</Button>
           </div>
        )}
      </section>

      {/* Local Impact Stats */}
      {location && !showLocationPrompt && (
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold uppercase tracking-wider">Resolved Locally</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">24</span>
            <span className="text-xs text-slate-500">this month</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold uppercase tracking-wider">Active Cases</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">12</span>
            <span className="text-xs text-slate-500">need verification</span>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3">
        <Button size="lg" className="h-14 md:h-16 text-sm md:text-base shadow-sm font-semibold" onClick={() => navigate('/report')}>
          Report new issue
        </Button>
        <Button size="lg" variant="outline" className="h-14 md:h-16 text-sm md:text-base shadow-sm border border-slate-200 bg-white font-semibold text-slate-700" onClick={() => navigate('/missions')}>
          Verify nearby issue
        </Button>
      </section>

      {/* Nearby Priority Cases */}
      <section className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Urgent Nearby</h2>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-medium" onClick={() => navigate('/missions')}>View all</Button>
        </div>
        
        {priorityCases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {priorityCases.map(c => (
              <CaseCard 
                key={c.id} 
                item={c} 
                onVerify={() => verifyCase(c.id, 'verify')} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            <p>No urgent cases nearby right now.</p>
          </div>
        )}
      </section>
    </div>
  )
}
