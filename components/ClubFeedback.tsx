'use client';

import { ClubFeedback } from '@/lib/types';

const ACCURACY_LABELS = ['Hook City', "Hookin'", 'Good Fade', 'Straight', 'Good Draw', "Slicin'", 'Slice Town'];
const ACCURACY_COLORS = ['#EF4444', '#FB923C', '#4ADE80', '#22D3EE', '#4ADE80', '#FB923C', '#EF4444'];

const POWER_LABELS = ['Pathetic', 'Fine', 'Decent', 'Good', 'Juiced'];
const POWER_COLORS = ['#EF4444', '#FB923C', '#FACC15', '#4ADE80', '#22D3EE'];

const CONSISTENCY_OPTIONS = [25, 50, 75, 100];

const PUTTING_LABELS = ['Awful', 'Meh', 'OK', 'Solid', 'Tiger'];
const PUTTING_COLORS = ['#EF4444', '#FB923C', '#FACC15', '#4ADE80', '#22D3EE'];

const THUMBS_ITEMS = [
  { key: 'takeAway', label: 'Takeaway' },
  { key: 'bodyRotation', label: 'Rotation' },
  { key: 'weightTransfer', label: 'Weight Transfer' },
  { key: 'compression', label: 'Compression' },
] as const;

export default function ClubFeedbackPanel({
  feedback,
  onChange,
  isPutter,
}: {
  feedback: ClubFeedback;
  onChange: (updated: ClubFeedback) => void;
  isPutter: boolean;
}) {
  const set = (patch: Partial<ClubFeedback>) => onChange({ ...feedback, ...patch });

  return (
    <div className="space-y-8">
      {/* ── Hitting Accuracy ── */}
      {!isPutter && (
        <div>
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-4">
            Hitting Accuracy
          </p>

          {/* Current label */}
          <p className="text-center text-sm font-semibold mb-3" style={{
            color: ACCURACY_COLORS[feedback.accuracy ?? 3],
          }}>
            {ACCURACY_LABELS[feedback.accuracy ?? 3]}
          </p>

          {/* Slider track with golf ball thumb */}
          <div className="relative px-3">
            {/* Track background — gradient red-green-red */}
            <div className="h-3 rounded-full overflow-hidden flex">
              <div className="flex-1 bg-gradient-to-r from-[#EF4444] to-[#4ADE80]" />
              <div className="flex-1 bg-gradient-to-r from-[#4ADE80] to-[#EF4444]" />
            </div>

            {/* Center tick mark */}
            <div className="absolute top-0 left-1/2 -translate-x-px w-0.5 h-3 bg-white/30" />

            {/* Range input — invisible, controls the value */}
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={feedback.accuracy ?? 3}
              onChange={(e) => set({ accuracy: Number(e.target.value) })}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-3"
              style={{ margin: '0 12px', width: 'calc(100% - 24px)' }}
            />

            {/* Golf ball thumb */}
            <div
              className="absolute top-1/2 pointer-events-none transition-all duration-150"
              style={{
                left: `calc(12px + (100% - 24px) * ${(feedback.accuracy ?? 3) / 6})`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Golf ball SVG */}
              <svg width="28" height="28" viewBox="0 0 28 28" className="drop-shadow-lg">
                <circle cx="14" cy="14" r="13" fill="white" stroke="#d4d4d4" strokeWidth={1} />
                {/* Dimple pattern */}
                <circle cx="10" cy="9" r="1.5" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="16" cy="8" r="1.5" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="13" cy="14" r="1.5" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="8" cy="15" r="1.5" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="18" cy="14" r="1.5" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="11" cy="20" r="1.5" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="17" cy="19" r="1.5" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="7" cy="11" r="1.2" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="20" cy="11" r="1.2" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="14" cy="6" r="1.2" fill="none" stroke="#ccc" strokeWidth={0.5} />
                <circle cx="14" cy="22" r="1.2" fill="none" stroke="#ccc" strokeWidth={0.5} />
              </svg>
            </div>
          </div>

          {/* Arrow indicators below */}
          <div className="flex justify-between items-end mt-3 px-2">
            {/* Big hook left */}
            <svg className="w-5 h-6 text-danger/40" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 22 C14 16, 10 10, 2 4" />
              <path d="M6 7 L2 4 L1 9" />
            </svg>
            {/* Straight */}
            <svg className="w-3 h-6 text-accent/40" viewBox="0 0 12 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 22 L6 4" />
              <path d="M3 8 L6 4 L9 8" />
            </svg>
            {/* Big slice right */}
            <svg className="w-5 h-6 text-danger/40" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 22 C6 16, 10 10, 18 4" />
              <path d="M19 9 L18 4 L14 7" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Power ── */}
      {!isPutter && (
        <div>
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3">
            Power
          </p>
          {/* Power meter visualization */}
          <div className="flex items-end gap-[3px] mb-3 h-10 px-1">
            {Array.from({ length: 20 }, (_, i) => {
              const powerLevel = feedback.power ?? -1;
              // Map 5 power levels to 20 bars: each level fills 4 bars
              const fillUpTo = (powerLevel + 1) * 4;
              const filled = i < fillUpTo;
              // Height grows from left to right
              const heightPct = 30 + (i / 19) * 70;
              // Color gradient: red -> orange -> yellow -> green -> cyan
              const color = filled
                ? POWER_COLORS[Math.min(Math.floor(i / 4), 4)]
                : undefined;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-200"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: filled ? color : '#1A2B1E',
                    opacity: filled ? 1 : 0.3,
                  }}
                />
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {POWER_LABELS.map((label, i) => {
              const selected = feedback.power === i;
              return (
                <button
                  key={i}
                  onClick={() => set({ power: selected ? undefined : i })}
                  className={`
                    flex-1 py-2.5 rounded-xl text-xs font-semibold
                    transition-all duration-150 active:scale-95 border
                    ${selected
                      ? 'border-transparent scale-105 shadow-lg'
                      : 'border-border text-text-muted/60 hover:border-text-muted/30'
                    }
                  `}
                  style={selected ? {
                    backgroundColor: POWER_COLORS[i] + '25',
                    color: POWER_COLORS[i],
                    borderColor: POWER_COLORS[i] + '50',
                  } : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Shot Consistency ── */}
      {!isPutter && (
        <div>
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3">
            Shot Consistency
          </p>
          <div className="flex items-stretch gap-4">
            {/* Tall boy can */}
            <div className="shrink-0 flex items-center">
              <svg className="h-full" width="52" viewBox="0 0 52 120" fill="none" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <clipPath id="can-clip">
                    <rect x="4" y="12" width="44" height="96" rx="4" />
                  </clipPath>
                </defs>
                {/* Can shell */}
                <rect x="4" y="12" width="44" height="96" rx="4"
                  stroke="currentColor" strokeWidth={1.5} className="text-text-muted/30" fill="#1A2B1E" />
                {/* Top rim */}
                <rect x="8" y="5" width="36" height="9" rx="3"
                  stroke="currentColor" strokeWidth={1.5} className="text-text-muted/30" fill="#1A2B1E" />
                {/* Tab */}
                <ellipse cx="26" cy="7" rx="6" ry="2"
                  stroke="currentColor" strokeWidth={1} className="text-text-muted/20" />
                {/* Liquid fill */}
                <rect
                  x="4"
                  width="44"
                  clipPath="url(#can-clip)"
                  className="transition-all duration-500 ease-out"
                  rx="4"
                  y={(() => {
                    const pct = feedback.consistency ?? 0;
                    const fillH = (pct / 100) * 96;
                    return 108 - fillH;
                  })()}
                  height={(() => {
                    const pct = feedback.consistency ?? 0;
                    return (pct / 100) * 96;
                  })()}
                  fill={
                    !feedback.consistency ? 'transparent'
                    : feedback.consistency <= 25 ? '#D97706'
                    : feedback.consistency === 50 ? '#F59E0B'
                    : '#FBBF24'
                  }
                  opacity={0.7}
                />
                {/* Foam head */}
                {feedback.consistency && feedback.consistency > 0 && (
                  <rect
                    x="4"
                    width="44"
                    clipPath="url(#can-clip)"
                    className="transition-all duration-500 ease-out"
                    y={(() => {
                      const pct = feedback.consistency ?? 0;
                      const fillH = (pct / 100) * 96;
                      return 108 - fillH - 7;
                    })()}
                    height="9"
                    fill="#FEF3C7"
                    opacity={0.45}
                  />
                )}
                {/* Can ridges */}
                <line x1="4" y1="40" x2="48" y2="40" stroke="currentColor" strokeWidth={0.5} className="text-text-muted/15" />
                <line x1="4" y1="80" x2="48" y2="80" stroke="currentColor" strokeWidth={0.5} className="text-text-muted/15" />
                {/* Bottom rim */}
                <rect x="8" y="106" width="36" height="6" rx="3"
                  stroke="currentColor" strokeWidth={1.5} className="text-text-muted/30" fill="none" />
              </svg>
            </div>

            {/* Percentage buttons */}
            <div className="flex-1 flex flex-col gap-1.5">
              {[...CONSISTENCY_OPTIONS].reverse().map((pct) => {
                const selected = feedback.consistency === pct;
                const color = pct <= 25 ? '#EF4444' : pct === 50 ? '#FACC15' : '#4ADE80';
                return (
                  <button
                    key={pct}
                    onClick={() => set({ consistency: selected ? undefined : pct })}
                    className={`
                      w-full py-2 rounded-lg text-[11px] font-bold tabular-nums
                      transition-all duration-150 active:scale-95 border
                      ${selected
                        ? 'border-transparent shadow-lg'
                        : 'border-border text-text-muted/60 hover:border-text-muted/30'
                      }
                    `}
                    style={selected ? {
                      backgroundColor: color + '20',
                      color: color,
                      borderColor: color + '50',
                    } : undefined}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Fundamentals ── */}
      <div>
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3">
          Fundamentals
        </p>
        <div className="grid grid-cols-2 gap-2">
          {THUMBS_ITEMS.map(({ key, label }) => {
            const val = feedback[key] as number | undefined;
            return (
              <div key={key} className="flex items-center h-11">
                {/* Minus (worse) */}
                <button
                  onClick={() => set({ [key]: val === -1 ? undefined : -1 })}
                  className={`
                    w-9 h-full flex items-center justify-center rounded-l-lg border
                    transition-all duration-150 active:scale-95 text-base font-bold
                    ${val === -1
                      ? 'bg-danger/15 border-danger/40 text-danger'
                      : 'border-border text-text-muted/40 hover:text-text-muted'
                    }
                  `}
                >
                  -
                </button>

                {/* Equal (same) */}
                <button
                  onClick={() => set({ [key]: val === 0 ? undefined : 0 })}
                  className={`
                    flex-1 h-full flex items-center justify-center border-y
                    transition-all duration-150 active:scale-95
                    ${val === 0
                      ? 'bg-accent-warm/15 border-accent-warm/40'
                      : 'border-border'
                    }
                  `}
                >
                  <span className={`text-[11px] font-medium whitespace-nowrap ${
                    val === 0 ? 'text-accent-warm' : val === -1 ? 'text-danger' : val === 1 ? 'text-accent' : 'text-text-muted'
                  }`}>
                    {label}
                  </span>
                </button>

                {/* Plus (better) */}
                <button
                  onClick={() => set({ [key]: val === 1 ? undefined : 1 })}
                  className={`
                    w-9 h-full flex items-center justify-center rounded-r-lg border
                    transition-all duration-150 active:scale-95 text-base font-bold
                    ${val === 1
                      ? 'bg-accent/15 border-accent/40 text-accent'
                      : 'border-border text-text-muted/40 hover:text-text-muted'
                    }
                  `}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Putting (putter only) ── */}
      {isPutter && (
        <div>
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3">
            Putting
          </p>
          <div className="flex gap-1.5">
            {PUTTING_LABELS.map((label, i) => {
              const selected = feedback.putting === i;
              return (
                <button
                  key={i}
                  onClick={() => set({ putting: selected ? undefined : i })}
                  className={`
                    flex-1 py-3 rounded-xl text-xs font-semibold
                    transition-all duration-150 active:scale-95 border
                    ${selected
                      ? 'border-transparent scale-105 shadow-lg'
                      : 'border-border text-text-muted/60 hover:border-text-muted/30'
                    }
                  `}
                  style={selected ? {
                    backgroundColor: PUTTING_COLORS[i] + '25',
                    color: PUTTING_COLORS[i],
                    borderColor: PUTTING_COLORS[i] + '50',
                  } : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Balls Hit Slider (session-level) ──

export function BallsHitSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
          Balls Hit Today
        </p>
        <span className="text-lg font-bold tabular-nums text-text">
          {value >= 100 ? '100+' : value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
          bg-border accent-accent
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-accent/30
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bg"
      />
      <div className="flex justify-between mt-1 px-0.5">
        <span className="text-[9px] text-text-muted/40">0</span>
        <span className="text-[9px] text-text-muted/40">25</span>
        <span className="text-[9px] text-text-muted/40">50</span>
        <span className="text-[9px] text-text-muted/40">75</span>
        <span className="text-[9px] text-text-muted/40">100+</span>
      </div>
    </div>
  );
}
