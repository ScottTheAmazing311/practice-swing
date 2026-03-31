'use client';

import { HoleResult, HOLE_RESULT_LABELS, HOLE_RESULT_POINTS } from '@/lib/swang-types';

const RESULTS: HoleResult[] = ['double_bogey_plus', 'bogey', 'par', 'birdie', 'eagle_plus'];
const RESULT_COLORS: Record<HoleResult, string> = {
  double_bogey_plus: '#F87171',
  bogey: '#FB923C',
  par: '#FACC15',
  birdie: '#4ADE80',
  eagle_plus: '#22D3EE',
};

export default function HoleResultPicker({
  value,
  onChange,
}: {
  value: HoleResult | null;
  onChange: (result: HoleResult) => void;
}) {
  return (
    <div className="space-y-3">
      {RESULTS.map((result) => {
        const selected = value === result;
        const pts = HOLE_RESULT_POINTS[result];
        return (
          <button
            key={result}
            onClick={() => onChange(result)}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[48px]
              flex items-center justify-between
              active:scale-[0.98]
              ${selected
                ? 'scale-[1.02] shadow-lg'
                : 'bg-bg-card border border-border text-text hover:border-text-muted/40'
              }`}
            style={selected ? { background: RESULT_COLORS[result], color: '#0F1A12' } : undefined}
          >
            <span>{HOLE_RESULT_LABELS[result]}</span>
            <span className={selected ? 'opacity-70' : 'text-text-muted'}>
              {pts > 0 ? `+${pts}` : pts} pts
            </span>
          </button>
        );
      })}
    </div>
  );
}
