import { CivicCase } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MapPin, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export function getSeverityColor(sev: number) {
  if (sev >= 5) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/30';
  if (sev === 4) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800/30';
  if (sev === 3) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/30';
  if (sev === 2) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/30';
  return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-600';
}

export function CaseCard({ item, onVerify }: { item: CivicCase, onVerify?: () => void }) {
  const navigate = useNavigate();

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer border-[#e2e8f0] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 dark:bg-slate-800" onClick={() => navigate(`/case/${item.id}`)}>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-wrap gap-1 items-center">
              <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 truncate">
                {item.category}
              </Badge>
              {item.bounty && (
                <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold shrink-0 flex items-center gap-1">
                  ${item.bounty.amount.toFixed(2)} Bounty
                </div>
              )}
            </div>
            <div className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border shrink-0 ${getSeverityColor(item.severity)}`}>
              Sev {item.severity}
            </div>
          </div>
          
          <h3 className="font-semibold text-base leading-snug text-slate-900 dark:text-slate-100 line-clamp-2" title={item.title}>
            {item.title}
          </h3>
          
          <div className="flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.locationLabel} - {item.distance}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.age}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{item.verificationCount}</span>
              </div>
            </div>
            {item.duplicateRisk === 'High' && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>High Duplicate Risk</span>
              </div>
            )}
          </div>

          {onVerify && (
            <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
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
    </motion.div>
  )
}
