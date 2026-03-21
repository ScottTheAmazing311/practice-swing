'use client';

const SEGMENT_COLORS = [
  '#EF4444', // 1 - red
  '#F87171', // 2
  '#FB923C', // 3
  '#FBBF24', // 4
  '#FACC15', // 5
  '#A3E635', // 6
  '#4ADE80', // 7
  '#34D399', // 8
  '#2DD4BF', // 9
  '#22D3EE', // 10 - cyan
];

const RATING_LABELS = [
  'Yikes',           // 1
  'Rough',           // 2
  'Off Day',         // 3
  'Shaking It Off',  // 4
  'Getting There',   // 5
  'Solid',           // 6
  'Feeling It',      // 7
  'Locked In',       // 8
  'Dialed In',       // 9
  'Pure',            // 10
];

export default function RatingBar({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Big number */}
      <div className="text-center">
        <span
          className="text-7xl font-bold tabular-nums transition-colors duration-200 block"
          style={{ color: SEGMENT_COLORS[value - 1] }}
        >
          {value}
        </span>
        <span className="text-xs text-text-muted font-medium uppercase tracking-wider mt-1 block">
          {RATING_LABELS[value - 1]}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          const active = n <= value;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="flex-1 h-12 rounded-lg transition-all duration-150 ease-out active:scale-y-90 relative group"
              style={{
                background: active ? SEGMENT_COLORS[i] : '#243328',
                opacity: active ? 1 : 0.4,
                boxShadow: active ? `0 2px 8px ${SEGMENT_COLORS[i]}30` : 'none',
              }}
              aria-label={`Rate ${n} out of 10`}
            >
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold transition-opacity duration-150 ${
                active ? 'opacity-100 text-bg' : 'opacity-0 group-hover:opacity-60 text-text-muted'
              }`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-text-muted font-medium uppercase tracking-wider">
        <span>Rough</span>
        <span>Pure</span>
      </div>
    </div>
  );
}
