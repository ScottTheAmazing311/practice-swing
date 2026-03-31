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
    <div className="space-y-4">
      {/* Big number display */}
      <div className="text-center">
        <span
          className="text-7xl font-bold tabular-nums transition-colors duration-200 block"
          style={{ color: value !== null ? GRADE_COLORS[value] : '#243328' }}
        >
          {value !== null ? value : '-'}
        </span>
        <span className="text-xs text-text-muted font-medium uppercase tracking-wider mt-1 block">
          {value !== null ? GRADE_LABELS[value] : 'Tap to grade'}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-1.5">
        {GRADE_LABELS.map((label, i) => {
          const active = value !== null && i <= value;
          return (
            <button
              key={i}
              onClick={() => onChange(i)}
              className="flex-1 h-12 rounded-lg transition-all duration-150 ease-out active:scale-y-90 relative group"
              style={{
                background: active ? GRADE_COLORS[i] : '#243328',
                opacity: active ? 1 : 0.4,
                boxShadow: active ? `0 2px 8px ${GRADE_COLORS[i]}30` : 'none',
              }}
            >
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold transition-opacity duration-150 ${
                active ? 'opacity-100 text-bg' : 'opacity-0 group-hover:opacity-60 text-text-muted'
              }`}>
                {i}
              </span>
            </button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-text-muted font-medium uppercase tracking-wider">
        <span>Awful</span>
        <span>Pure</span>
      </div>
    </div>
  );
}
