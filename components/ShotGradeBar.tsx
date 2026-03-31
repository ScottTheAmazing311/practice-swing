'use client';

const GRADE_LABELS = ['Awful', 'Poor', 'Okay', 'Good', 'Great', 'Pure'];
const GRADE_COLORS = ['#F87171', '#FB923C', '#FACC15', '#A3E635', '#4ADE80', '#22D3EE'];

export default function ShotGradeBar({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (grade: number) => void;
}) {
  return (
    <div className="space-y-3">
      {value !== null && (
        <div className="text-center">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{ color: GRADE_COLORS[value] }}
          >
            {value}
          </span>
          <p className="text-xs text-text-muted mt-1">{GRADE_LABELS[value]}</p>
        </div>
      )}
      <div className="flex gap-2">
        {GRADE_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[48px]
              active:scale-95
              ${value === i
                ? 'scale-105 shadow-lg'
                : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
              }`}
            style={value === i ? { background: GRADE_COLORS[i], color: '#0F1A12' } : undefined}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}
