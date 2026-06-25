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

  return (
    <div 
      className={cn(
        "bg-white border-b border-slate-100 last:border-0 p-3.5 md:p-4 flex gap-3 items-start transition-colors hover:bg-slate-50 cursor-pointer active:bg-slate-100",
        compact ? "py-3" : "py-4"
      )}
      onClick={() => navigate(`/case/${item.id}`)}
    >
      {/* Severity Indicator Rail/Dot */}
      <div className={cn(
        "w-1.5 shrink-0 rounded-full mt-1",
        item.severity >= 5 ? "bg-red-500 h-10" :
        item.severity === 4 ? "bg-orange-500 h-10" :
        item.severity === 3 ? "bg-amber-500 h-10" :
        "bg-green-500 h-10"
      )} />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {item.category}
          </span>
          <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Clock className="w-3 h-3" /> {item.age}
          </span>
        </div>
        
        <h3 className="font-semibold text-sm leading-snug text-slate-900 line-clamp-2">
          {item.title}
        </h3>

        {/* Mission Reason Label */}
        <div className="flex flex-wrap gap-1 mt-1">
          {item.duplicateRisk === 'High' && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">Duplicate check needed</span>}
          {item.evidenceQuality === 'Low' && <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-medium">Evidence quality low</span>}
          {item.locationSource === 'Manual pin' && <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-medium">Needs location confirmation</span>}
          {item.severity >= 4 && <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">High safety risk</span>}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.distance}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600 font-medium">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>{item.verificationCount}</span>
          </div>
          {item.duplicateRisk === 'High' && (
            <div className="flex items-center gap-1 text-amber-600 font-medium">
              <AlertTriangle className="w-3 h-3 shrink-0" />
            </div>
          )}
        </div>

        {onVerify && !compact && (
          <div className="mt-2.5 flex gap-2">
            {!item.verifiedByMe && item.status !== 'Resolved' && item.status !== 'Fix Verified' && (
              <button 
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors w-full text-center"
                onClick={(e) => { e.stopPropagation(); onVerify(); }}
              >
                Verify (+5 Trust)
              </button>
            )}
            {item.verifiedByMe && (
              <button 
                className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-medium w-full text-center cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                Verified
              </button>
            )}
             {!item.verifiedByMe && item.status === 'Resolved' && (
              <button 
                className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors w-full text-center"
                onClick={(e) => { e.stopPropagation(); onVerify(); }}
              >
                Confirm Fixed (+12 Trust)
              </button>
            )}
          </div>
        )}
      </div>
      
      {compact && (
        <div className="shrink-0 flex items-center justify-center self-center text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}
