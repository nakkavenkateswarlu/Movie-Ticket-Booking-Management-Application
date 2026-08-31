import type { CaseStage } from '@/lib/types';
import { Check, X } from 'lucide-react';

interface StageProgressProps {
  currentStage: CaseStage;
  resolutionStatus?: 'Confirmed' | 'Cancelled' | null;
}

const STAGES: { key: CaseStage; label: string }[] = [
  { key: 'Initial', label: 'Initial' },
  { key: 'Availability', label: 'Availability' },
  { key: 'Approval', label: 'Approval' },
  { key: 'Booking Execution', label: 'Booking Execution' },
  { key: 'Resolved', label: 'Resolved' },
];

export function StageProgress({ currentStage, resolutionStatus }: StageProgressProps) {
  const isResolved = currentStage === 'Resolved';
  const isCancelled = isResolved && resolutionStatus === 'Cancelled';

  const getIndex = (s: CaseStage) => STAGES.findIndex((x) => x.key === s);
  const currentIdx = getIndex(currentStage);

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STAGES.map((stage, i) => {
          const isComplete = isResolved || i < currentIdx;
          const isCurrent = !isResolved && i === currentIdx;
          const isLast = i === STAGES.length - 1;

          let dotClass = 'bg-slate-200 text-slate-400 ring-slate-200';
          if (isCancelled && isLast) {
            dotClass = 'bg-red-500 text-white ring-red-200';
          } else if (isCancelled && isComplete && i < STAGES.length - 1) {
            dotClass = 'bg-slate-300 text-white ring-slate-200';
          } else if (isComplete && !isCancelled) {
            dotClass = 'bg-emerald-500 text-white ring-emerald-200';
          } else if (isCurrent) {
            dotClass = 'bg-sky-600 text-white ring-sky-200';
          }

          return (
            <div key={stage.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ring-4 ${dotClass} transition-colors`}
                >
                  {isComplete && !isCurrent ? (
                    isCancelled && isLast ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${isCurrent ? 'text-sky-700' : isComplete && !isCancelled ? 'text-emerald-700' : 'text-slate-400'}`}
                >
                  {stage.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-2 mb-5 h-0.5 flex-1 rounded ${isComplete && !isCancelled ? 'bg-emerald-400' : 'bg-slate-200'} transition-colors`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
