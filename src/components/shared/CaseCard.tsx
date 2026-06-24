import { CivicCase } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MapPin, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function getSeverityColor(sev: number) {
  if (sev >= 5) return 'bg-red-100 text-red-800 border-red-200';
  if (sev === 4) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (sev === 3) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (sev === 2) return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-slate-100 text-slate-800 border-slate-200';
}

export function CaseCard({ item, onVerify }: { item: CivicCase, onVerify?: () => void }) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer hover:border-slate-300" onClick={() => navigate(`/case/${item.id}`)}>
      <CardContent className="p-0">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-2">
            <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 border-slate-200 truncate">
              {item.category}
            </Badge>
            <div className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border shrink-0 ${getSeverityColor(item.severity)}`}>
              Sev {item.severity}
            </div>
          </div>
          
          <h3 className="font-semibold text-base leading-snug text-slate-900 line-clamp-2" title={item.title}>
            {item.title}
          </h3>
          
          <div className="flex flex-col gap-1.5 text-xs text-slate-500 mt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.locationLabel} • {item.distance}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.age}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{item.verificationCount}</span>
              </div>
            </div>
            {item.duplicateRisk === 'High' && (
              <div className="flex items-center gap-1.5 text-amber-600 mt-0.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>High Duplicate Risk</span>
              </div>
            )}
          </div>

          {onVerify && (
            <div className="mt-2 pt-3 border-t border-slate-100 flex gap-2">
              {!item.verifiedByMe && item.status !== 'Resolved' && item.status !== 'Fix Verified' && (
                <Button size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); onVerify(); }}>
                  Verify now (+5 Trust)
                </Button>
              )}
              {item.verifiedByMe && (
                <Button variant="secondary" size="sm" disabled className="w-full text-xs">
                  Verified by you
                </Button>
              )}
              {!item.verifiedByMe && item.status === 'Resolved' && (
                <Button size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700 text-white" onClick={(e) => { e.stopPropagation(); onVerify(); }}>
                  Confirm Fixed (+12 Trust)
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
