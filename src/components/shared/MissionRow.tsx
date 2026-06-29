import { CivicCase } from '../../types';
import { getSeverityColor } from './CaseCard';
import { MapPin, Clock, ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import React from 'react';

export interface MissionRowProps {
  item: CivicCase;
  onVerify?: () => void;
  compact?: boolean;
}

export const MissionRow: React.FC<MissionRowProps> = ({ item, onVerify, compact = false }) => {
  const navigate = useNavigate();

  const getSeverityColorSafe = (severity: number) => {
    if (severity >= 5) return 'bg-red-500';
    if (severity === 4) return 'bg-orange-500';
    if (severity === 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const severityColor = getSeverityColorSafe(item.severity);

  if (!compact) {
    return (
      <div 
        className="bg-white dark:bg-slate-800 rounded-[16px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm relative overflow-hidden transition-all hover:shadow-md cursor-pointer active:bg-slate-50 dark:active:bg-slate-700"
        onClick={() => navigate(`/case/${item.id}`)}
      >
        {/* Left thick border */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", severityColor)} />
        
        <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 ml-1.5">
          {/* Top row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", severityColor)} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {item.category}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {item.age}
            </span>
          </div>

          {/* Middle Content */}
          <div className="flex justify-between gap-3">
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <h3 className="font-bold text-[14px] sm:text-[15px] leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
                {item.title}
              </h3>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-0.5">
                {item.duplicateRisk === 'High' && <span className="text-[9px] sm:text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">Duplicate check</span>}
                {item.severity >= 4 && <span className="text-[9px] sm:text-[10px] bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">High safety risk</span>}
              </div>

              {/* Location & Trust */}
              <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-medium truncate">{item.distance} away</span>
                </div>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 shrink-0" />
                <div className="flex items-center gap-1 font-medium text-[#0f284b] dark:text-blue-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{item.verificationCount} trust</span>
                </div>
              </div>
            </div>

            {/* Image Placeholder */}
            <div className="w-20 h-16 sm:w-24 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
              {item.imagePlaceholder ? (
                <img src={item.imagePlaceholder} className="w-full h-full object-cover" alt="Issue Evidence" referrerPolicy="no-referrer" />
              ) : item.category === 'Pothole / road damage' ? (
                <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Issue" referrerPolicy="no-referrer" />
              ) : item.category === 'Water leakage' ? (
                <img src="https://images.unsplash.com/photo-1620215714392-4f05fc2b7811?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Issue" referrerPolicy="no-referrer" />
              ) : item.category === 'Broken streetlight' ? (
                <img src="https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Issue" referrerPolicy="no-referrer" />
              ) : item.category === 'Garbage overflow' ? (
                <img src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Issue" referrerPolicy="no-referrer" />
              ) : item.category === 'Other civic hazard' ? (
                <img src="https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Issue" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          {onVerify && (
            <div className="mt-2">
              {!item.verifiedByMe && item.status !== 'Resolved' && item.status !== 'Fix Verified' && (
                <button 
                  className="bg-blue-50/50 dark:bg-blue-900/20 text-[#1448db] dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/40 py-2 rounded-[8px] text-[11px] sm:text-xs font-bold transition-colors w-full flex items-center justify-center gap-1 shadow-sm"
                  onClick={(e) => { e.stopPropagation(); onVerify(); }}
                >
                  Verify (+5 Trust) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {item.verifiedByMe && (
                <button 
                  className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-[#e2e8f0] dark:border-slate-700 py-2 rounded-[8px] text-[11px] sm:text-xs font-bold w-full text-center cursor-default shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Verified
                </button>
              )}
               {!item.verifiedByMe && item.status === 'Resolved' && (
                <button 
                  className="bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 py-2 rounded-[8px] text-[11px] sm:text-xs font-bold transition-colors w-full flex items-center justify-center gap-1 shadow-sm"
                  onClick={(e) => { e.stopPropagation(); onVerify(); }}
                >
                  Confirm Fixed (+12 Trust) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact layout
  return (
    <div 
      className={cn(
        "bg-white dark:bg-slate-800 border-b border-[#e2e8f0] dark:border-slate-700 last:border-0 p-4 md:p-5 flex gap-3.5 items-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer active:bg-slate-100 dark:active:bg-slate-600 py-4"
      )}
      onClick={() => navigate(`/case/${item.id}`)}
    >
      {/* Severity Indicator Rail/Dot */}
      <div className={cn(
        "w-1.5 shrink-0 rounded-full mt-1.5 h-10",
        severityColor
      )} />

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {item.category}
          </span>
          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Clock className="w-3 h-3" /> {item.age}
          </span>
        </div>
        
        <h3 className="font-bold text-sm leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
          {item.title}
        </h3>

        {/* Mission Reason Label */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {item.duplicateRisk === 'High' && <span className="text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 px-2 py-0.5 rounded-full font-bold">Duplicate check needed</span>}
          {item.evidenceQuality === 'Low' && <span className="text-[10px] bg-[#f8f9fc] dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700 px-2 py-0.5 rounded-full font-bold">Evidence quality low</span>}
          {item.locationSource === 'Manual pin' && <span className="text-[10px] bg-[#f8f9fc] dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700 px-2 py-0.5 rounded-full font-bold">Needs location confirmation</span>}
          {item.severity >= 4 && <span className="text-[10px] bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 px-2 py-0.5 rounded-full font-bold">High safety risk</span>}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-medium">{item.distance}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#0f284b] dark:text-blue-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{item.verificationCount}</span>
          </div>
          {item.duplicateRisk === 'High' && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            </div>
          )}
        </div>
      </div>
      
      <div className="shrink-0 flex items-center justify-center self-center text-slate-300 dark:text-slate-600">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  )
}
