'use client';

import { BONUS_REASONS, MAX_BONUS } from '@/lib/swang-types';

export default function BonusPointsPicker({
  points,
  reason,
  onPointsChange,
  onReasonChange,
}: {
  points: number;
  reason: string | null;
  onPointsChange: (pts: number) => void;
  onReasonChange: (reason: string | null) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Points selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Bonus Points</p>
          <span className="text-xs text-text-muted tabular-nums">{MAX_BONUS} max</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => {
                onPointsChange(n);
                if (n === 0) onReasonChange(null);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold tabular-nums transition-all duration-150 min-h-[48px]
                active:scale-95
                ${points === n
                  ? n === 0
                    ? 'bg-bg-input border border-border text-text shadow-md'
                    : 'bg-accent text-bg shadow-md'
                  : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                }`}
            >
              {n === 0 ? 'None' : `+${n}`}
            </button>
          ))}
        </div>
      </div>

      {/* Reason selector — only show when points > 0 */}
      {points > 0 && (
        <div className="space-y-3 anim-fade-up">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Why?</p>
          <div className="grid grid-cols-2 gap-2">
            {BONUS_REASONS.map((r) => {
              const active = reason === r;
              return (
                <button
                  key={r}
                  onClick={() => onReasonChange(active ? null : r)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left min-h-[44px]
                    active:scale-95
                    ${active
                      ? 'bg-accent text-bg shadow-md'
                      : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                    }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
