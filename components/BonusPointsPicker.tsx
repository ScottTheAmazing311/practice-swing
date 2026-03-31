'use client';

import { BONUS_OPTIONS, MAX_BONUS } from '@/lib/swang-types';

export default function BonusPointsPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (bonuses: string[]) => void;
}) {
  const currentTotal = selected.length;

  const toggle = (bonus: string) => {
    if (selected.includes(bonus)) {
      onChange(selected.filter((b) => b !== bonus));
    } else if (currentTotal < MAX_BONUS) {
      onChange([...selected, bonus]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Bonus Points</p>
        <span className="text-xs text-text-muted tabular-nums">+{currentTotal} / {MAX_BONUS} max</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {BONUS_OPTIONS.map((bonus) => {
          const active = selected.includes(bonus);
          const disabled = !active && currentTotal >= MAX_BONUS;
          return (
            <button
              key={bonus}
              onClick={() => !disabled && toggle(bonus)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[44px]
                active:scale-95
                ${active
                  ? 'bg-accent text-bg shadow-md'
                  : disabled
                    ? 'bg-bg-card border border-border text-text-muted/40 cursor-not-allowed'
                    : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                }`}
            >
              {bonus} (+1)
            </button>
          );
        })}
      </div>
    </div>
  );
}
