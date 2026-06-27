import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CivicCase } from '../../types';
import { getLifecycleStage, getBlockerReason, LifecycleStage } from '../../lib/caseLifecycle';

const STAGES: LifecycleStage[] = [
  'Draft analyzed',
  'Reported',
  'Community verification needed',
  'Community verified',
  'Reviewer packet prepared',
  'Field repair claimed',
  'Fix verification needed',
  'Fix verified',
  'Closed'
];

export function ProofLadder({ caseItem }: { caseItem: CivicCase }) {
  const currentStageName = getLifecycleStage(caseItem);
  const currentIndex = STAGES.indexOf(currentStageName);
  const blockerReason = getBlockerReason(caseItem);

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isFuture = idx > currentIndex;
        const isBlocked = isCurrent && blockerReason;
        
        return (
          <div key={stage} className="flex gap-4 items-start">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 shrink-0 mt-0.5",
              isCompleted ? "border-blue-600 dark:border-blue-500" : isCurrent ? "border-blue-600 dark:border-blue-500" : "border-slate-300 dark:border-slate-700",
              isCurrent && "ring-4 ring-blue-50 dark:ring-blue-950/40"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : isBlocked ? (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              ) : isCurrent ? (
                <Circle className="w-3 h-3 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
              ) : (
                <Circle className="w-3 h-3 text-slate-300 dark:text-slate-600" />
              )}
            </div>
            <div className="flex-1 flex flex-col pt-1">
              <span className={cn(
                "font-medium text-sm leading-tight",
                isCompleted ? "text-slate-900 dark:text-slate-200" : isFuture ? "text-slate-400 dark:text-slate-500" : "text-blue-700 dark:text-blue-400 font-semibold",
                isBlocked && "text-amber-800 dark:text-amber-300"
              )}>
                {stage}
              </span>
              {isBlocked && (
                <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded inline-block w-fit border border-amber-100 dark:border-amber-900/30">
                  {blockerReason}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}
