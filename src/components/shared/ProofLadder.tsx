import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

const STAGES = [
  'Reported',
  'AI Analyzed',
  'Community Verified',
  'Authority Ready',
  'Escalated',
  'Resolved',
  'Fix Verified'
];

export function ProofLadder({ currentStage }: { currentStage: number }) {
  return (
    <div className="flex flex-col gap-4 relative">
      <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-200 -z-10" />
      {STAGES.map((stage, idx) => {
        const isCompleted = idx <= currentStage;
        const isCurrent = idx === currentStage;
        
        return (
          <div key={stage} className="flex gap-4 items-center">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center bg-white border-2",
              isCompleted ? "border-blue-600" : "border-slate-300",
              isCurrent && "ring-4 ring-blue-50"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              ) : (
                <Circle className="w-3 h-3 text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <span className={cn(
                "font-medium text-sm",
                isCompleted ? "text-slate-900" : "text-slate-400",
                isCurrent && "text-blue-700 font-semibold"
              )}>
                {stage}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  );
}
