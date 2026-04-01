'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

// --- Types ---

type Phase =
  | 'title'
  | 'drive_power' | 'drive_accuracy' | 'drive_skill' | 'drive_result'
  | 'iron_power' | 'iron_accuracy' | 'iron_skill' | 'iron_result'
  | 'putt_aim' | 'putt_power' | 'putt_result'
  | 'hole_complete' | 'game_over';

interface HoleScore {
  hole: number;
  driveScores: number[];
  driveDistance: number;
  driveLie: string;
  ironScores: number[];
  ironDistance: number;
  puttAimScore: number;
  puttPowerScore: number;
  sunk: boolean;
  totalPoints: number;
}

// --- Constants ---

const HOLE_COUNT = 9;
const HIGH_SCORE_KEY = 'swang-quickplay-high';
const SWEET_CENTER = 50;

const SCORE_COLORS: [number, string][] = [
  [95, '#22D3EE'],
  [80, '#4ADE80'],
  [60, '#FACC15'],
  [40, '#FB923C'],
  [0, '#F87171'],
];

const SCORE_LABELS: [number, string][] = [
  [95, 'Perfect'],
  [80, 'Great'],
  [60, 'Good'],
  [40, 'OK'],
  [20, 'Rough'],
  [0, 'Shanked'],
];

function scoreColor(s: number) {
  for (const [min, c] of SCORE_COLORS) if (s >= min) return c;
  return '#F87171';
}

function scoreLabel(s: number) {
  for (const [min, l] of SCORE_LABELS) if (s >= min) return l;
  return 'Shanked';
}

// --- Difficulty ---

function getDifficulty(hole: number) {
  const t = (hole - 1) / (HOLE_COUNT - 1);
  return {
    sweetWidth: 22 - t * 12,       // 22% → 10%
    oscSpeed: 1.2 + t * 1.6,       // oscillation speed multiplier
    fillSpeed: 0.6 + t * 0.9,      // hold-fill speed
    puttAimSpeed: 1.0 + t * 1.8,   // putt arrow speed
    puttSweetWidth: 18 - t * 8,    // putt power sweet spot
  };
}

// --- Scoring helpers ---

function calcScore(pos: number, sweetW: number): number {
  const dist = Math.abs(pos - SWEET_CENTER);
  const half = sweetW / 2;
  if (dist <= half) return 100;
  const over = dist - half;
  return Math.max(0, Math.round(100 - over * 2.8));
}

function driveDistance(power: number): number {
  return Math.round(180 + (power / 100) * 120);
}

function driveLie(skill: number): string {
  if (skill >= 80) return 'Fairway';
  if (skill >= 55) return 'Light Rough';
  if (skill >= 30) return 'Heavy Rough';
  return 'Bunker';
}

function lieColor(lie: string): string {
  if (lie === 'Fairway') return '#4ADE80';
  if (lie === 'Light Rough') return '#FACC15';
  if (lie === 'Heavy Rough') return '#FB923C';
  return '#F87171';
}

function ironProximity(avg: number): number {
  if (avg >= 90) return Math.round(3 + Math.random() * 4);
  if (avg >= 70) return Math.round(10 + Math.random() * 10);
  if (avg >= 50) return Math.round(25 + Math.random() * 15);
  if (avg >= 30) return Math.round(45 + Math.random() * 20);
  return Math.round(70 + Math.random() * 30);
}

function puttSunk(aimScore: number, powerScore: number, distFt: number): boolean {
  const combined = (aimScore + powerScore) / 2;
  if (distFt <= 5) return combined >= 50;
  if (distFt <= 15) return combined >= 70;
  if (distFt <= 30) return combined >= 85;
  return combined >= 95;
}

function holePoints(d: number[], i: number[], aimS: number, powS: number, sunk: boolean): number {
  const driveAvg = d.reduce((a, b) => a + b, 0) / d.length;
  const ironAvg = i.reduce((a, b) => a + b, 0) / i.length;
  const puttAvg = (aimS + powS) / 2;
  const base = Math.round(driveAvg * 0.3 + ironAvg * 0.35 + puttAvg * 0.35);
  return sunk ? base + 20 : base;
}

function getHighScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
}

function setHighScore(score: number) {
  localStorage.setItem(HIGH_SCORE_KEY, String(score));
}

// --- Components ---

function OscillatingBar({
  speed,
  sweetWidth,
  onTap,
  label,
}: {
  speed: number;
  sweetWidth: number;
  onTap: (score: number) => void;
  label: string;
}) {
  const [pos, setPos] = useState(0);
  const [locked, setLocked] = useState<number | null>(null);
  const animRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (locked !== null) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000;
      const p = (Math.sin(elapsed * speed * Math.PI) + 1) / 2 * 100;
      setPos(p);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, locked]);

  const handleTap = () => {
    if (locked !== null) return;
    setLocked(pos);
    const s = calcScore(pos, sweetWidth);
    setTimeout(() => onTap(s), 300);
  };

  const displayPos = locked !== null ? locked : pos;
  const score = locked !== null ? calcScore(locked, sweetWidth) : null;

  return (
    <button
      onClick={handleTap}
      className="w-full space-y-2 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</span>
        {score !== null && (
          <span className="text-xs font-bold" style={{ color: scoreColor(score) }}>
            {scoreLabel(score)}
          </span>
        )}
      </div>
      <div className="relative h-10 bg-bg-card border border-border rounded-xl overflow-hidden">
        {/* Sweet spot zone */}
        <div
          className="absolute top-0 bottom-0 rounded-sm"
          style={{
            left: `${SWEET_CENTER - sweetWidth / 2}%`,
            width: `${sweetWidth}%`,
            background: 'rgba(74, 222, 128, 0.15)',
            borderLeft: '1px solid rgba(74, 222, 128, 0.3)',
            borderRight: '1px solid rgba(74, 222, 128, 0.3)',
          }}
        />
        {/* Center line */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: '50%', background: 'rgba(74, 222, 128, 0.4)' }}
        />
        {/* Marker */}
        <div
          className="absolute top-1 bottom-1 w-2 rounded-full transition-colors duration-100"
          style={{
            left: `calc(${displayPos}% - 4px)`,
            background: locked !== null ? scoreColor(calcScore(locked, sweetWidth)) : '#F1F5F0',
            boxShadow: locked !== null ? `0 0 8px ${scoreColor(calcScore(locked, sweetWidth))}60` : '0 0 6px rgba(255,255,255,0.3)',
          }}
        />
      </div>
    </button>
  );
}

function HoldReleaseBar({
  speed,
  sweetWidth,
  onRelease,
  label,
}: {
  speed: number;
  sweetWidth: number;
  onRelease: (score: number) => void;
  label: string;
}) {
  const [fill, setFill] = useState(0);
  const [holding, setHolding] = useState(false);
  const [released, setReleased] = useState<number | null>(null);
  const animRef = useRef(0);
  const dirRef = useRef(1);

  useEffect(() => {
    if (!holding || released !== null) return;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setFill((prev) => {
        let next = prev + dirRef.current * speed * 60 * dt;
        if (next >= 100) { next = 100; dirRef.current = -1; }
        if (next <= 0) { next = 0; dirRef.current = 1; }
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [holding, speed, released]);

  const handleDown = () => {
    if (released !== null) return;
    setHolding(true);
    dirRef.current = 1;
  };

  const handleUp = () => {
    if (released !== null || !holding) return;
    setHolding(false);
    setReleased(fill);
    cancelAnimationFrame(animRef.current);
    const s = calcScore(fill, sweetWidth);
    setTimeout(() => onRelease(s), 300);
  };

  const displayFill = released !== null ? released : fill;
  const score = released !== null ? calcScore(released, sweetWidth) : null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</span>
        {score !== null ? (
          <span className="text-xs font-bold" style={{ color: scoreColor(score) }}>
            {scoreLabel(score)}
          </span>
        ) : (
          <span className="text-[10px] text-text-muted/50">
            {holding ? 'Release!' : 'Hold'}
          </span>
        )}
      </div>
      <button
        onMouseDown={handleDown}
        onMouseUp={handleUp}
        onTouchStart={handleDown}
        onTouchEnd={handleUp}
        className="relative w-full h-10 bg-bg-card border border-border rounded-xl overflow-hidden select-none touch-none active:scale-[0.99] transition-transform"
      >
        {/* Sweet spot zone */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${SWEET_CENTER - sweetWidth / 2}%`,
            width: `${sweetWidth}%`,
            background: 'rgba(74, 222, 128, 0.15)',
            borderLeft: '1px solid rgba(74, 222, 128, 0.3)',
            borderRight: '1px solid rgba(74, 222, 128, 0.3)',
          }}
        />
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: '50%', background: 'rgba(74, 222, 128, 0.4)' }}
        />
        {/* Fill */}
        <div
          className="absolute top-0 bottom-0 left-0 transition-colors duration-100"
          style={{
            width: `${displayFill}%`,
            background: released !== null
              ? `${scoreColor(calcScore(released, sweetWidth))}30`
              : holding ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.05)',
          }}
        />
        {/* Marker at fill position */}
        <div
          className="absolute top-1 bottom-1 w-2 rounded-full"
          style={{
            left: `calc(${displayFill}% - 4px)`,
            background: released !== null ? scoreColor(calcScore(released, sweetWidth)) : holding ? '#F1F5F0' : '#8CA394',
            boxShadow: released !== null ? `0 0 8px ${scoreColor(calcScore(released, sweetWidth))}60` : 'none',
          }}
        />
      </button>
    </div>
  );
}

function PuttAim({
  speed,
  onLock,
}: {
  speed: number;
  onLock: (score: number) => void;
}) {
  const [pos, setPos] = useState(50);
  const [locked, setLocked] = useState<number | null>(null);
  const animRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (locked !== null) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000;
      const p = (Math.sin(elapsed * speed * Math.PI) + 1) / 2 * 100;
      setPos(p);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, locked]);

  const handleTap = () => {
    if (locked !== null) return;
    setLocked(pos);
    const dist = Math.abs(pos - 50);
    const s = Math.max(0, Math.round(100 - dist * 2.5));
    setTimeout(() => onLock(s), 400);
  };

  const displayPos = locked !== null ? locked : pos;
  const score = locked !== null ? Math.max(0, Math.round(100 - Math.abs(locked - 50) * 2.5)) : null;

  return (
    <button onClick={handleTap} className="w-full space-y-4 active:scale-[0.99] transition-transform">
      <p className="text-xs text-text-muted font-medium uppercase tracking-wider text-center">Line up the putt</p>

      {/* Target arrow (top, fixed center) */}
      <div className="relative h-8 flex items-center justify-center">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '14px solid #4ADE80',
          }}
        />
      </div>

      {/* Putting line */}
      <div className="relative h-24 bg-bg-card border border-border rounded-xl overflow-hidden">
        {/* Center guide */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'rgba(74, 222, 128, 0.15)' }} />
        {/* Line from top arrow to bottom arrow */}
        {locked !== null && (
          <div
            className="absolute top-0 h-full w-0.5 rounded-full"
            style={{
              left: `calc(50% - 1px)`,
              background: `linear-gradient(to bottom, rgba(74, 222, 128, 0.4), ${scoreColor(score!)}40)`,
            }}
          />
        )}
        {/* Aiming text */}
        <div className="absolute inset-0 flex items-center justify-center">
          {score !== null ? (
            <span className="text-sm font-bold" style={{ color: scoreColor(score) }}>{scoreLabel(score)}</span>
          ) : (
            <span className="text-xs text-text-muted/40">Tap to lock aim</span>
          )}
        </div>
      </div>

      {/* Moving arrow (bottom) */}
      <div className="relative h-8 flex items-center">
        <div
          className="absolute transition-none"
          style={{ left: `calc(${displayPos}% - 10px)` }}
        >
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: locked !== null ? `14px solid ${scoreColor(score!)}` : '14px solid #F1F5F0',
              filter: locked !== null ? `drop-shadow(0 0 4px ${scoreColor(score!)}60)` : 'none',
            }}
          />
        </div>
      </div>
    </button>
  );
}

function PuttPower({
  sweetWidth,
  onRelease,
}: {
  sweetWidth: number;
  onRelease: (score: number) => void;
}) {
  const [fill, setFill] = useState(0);
  const [holding, setHolding] = useState(false);
  const [released, setReleased] = useState<number | null>(null);
  const animRef = useRef(0);

  useEffect(() => {
    if (!holding || released !== null) return;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setFill((prev) => {
        const next = prev + dt * 55;
        return next >= 100 ? 100 : next;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [holding, released]);

  const handleDown = () => {
    if (released !== null) return;
    setFill(0);
    setHolding(true);
  };

  const handleUp = () => {
    if (released !== null || !holding) return;
    setHolding(false);
    setReleased(fill);
    cancelAnimationFrame(animRef.current);
    const s = calcScore(fill, sweetWidth);
    setTimeout(() => onRelease(s), 400);
  };

  const displayFill = released !== null ? released : fill;
  const score = released !== null ? calcScore(released, sweetWidth) : null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Pull back & release</span>
        {score !== null ? (
          <span className="text-xs font-bold" style={{ color: scoreColor(score) }}>{scoreLabel(score)}</span>
        ) : (
          <span className="text-[10px] text-text-muted/50">{holding ? 'Release!' : 'Hold to pull back'}</span>
        )}
      </div>
      <button
        onMouseDown={handleDown}
        onMouseUp={handleUp}
        onTouchStart={handleDown}
        onTouchEnd={handleUp}
        className="relative w-full h-32 bg-bg-card border border-border rounded-xl overflow-hidden select-none touch-none"
      >
        {/* Hidden sweet spot — NOT shown to user */}
        {released !== null && (
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: `${SWEET_CENTER - sweetWidth / 2}%`,
              height: `${sweetWidth}%`,
              background: 'rgba(74, 222, 128, 0.1)',
              borderTop: '1px dashed rgba(74, 222, 128, 0.3)',
              borderBottom: '1px dashed rgba(74, 222, 128, 0.3)',
            }}
          />
        )}
        {/* Fill from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-colors duration-100"
          style={{
            height: `${displayFill}%`,
            background: released !== null
              ? `${scoreColor(score!)}20`
              : holding
                ? 'linear-gradient(to top, rgba(74, 222, 128, 0.3), rgba(74, 222, 128, 0.05))'
                : 'rgba(255,255,255,0.03)',
          }}
        />
        {/* Marker line */}
        <div
          className="absolute left-2 right-2 h-1 rounded-full"
          style={{
            bottom: `calc(${displayFill}% - 2px)`,
            background: released !== null ? scoreColor(score!) : holding ? '#F1F5F0' : '#8CA394',
            boxShadow: released !== null ? `0 0 8px ${scoreColor(score!)}60` : 'none',
          }}
        />
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {score !== null ? (
            <p className="text-2xl font-black tabular-nums" style={{ color: scoreColor(score) }}>{score}</p>
          ) : !holding ? (
            <p className="text-text-muted/30 text-xs">Hold anywhere</p>
          ) : null}
        </div>
      </button>
    </div>
  );
}

// --- Main Game ---

export default function QuickPlayPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('title');
  const [hole, setHole] = useState(1);

  // Per-hole state
  const [driveScores, setDriveScores] = useState<number[]>([]);
  const [ironScores, setIronScores] = useState<number[]>([]);
  const [puttAimScore, setPuttAimScore] = useState(0);
  const [puttPowerScore, setPuttPowerScore] = useState(0);

  // Derived from drive
  const [driveDist, setDriveDist] = useState(0);
  const [driveLieText, setDriveLieText] = useState('');

  // Derived from iron
  const [ironDist, setIronDist] = useState(0);

  // Derived from putt
  const [didSink, setDidSink] = useState(false);

  // All holes
  const [scores, setScores] = useState<HoleScore[]>([]);
  const [highScore, setHighScoreState] = useState(0);

  useEffect(() => {
    setHighScoreState(getHighScore());
  }, []);

  const diff = getDifficulty(hole);

  const resetHole = useCallback(() => {
    setDriveScores([]);
    setIronScores([]);
    setPuttAimScore(0);
    setPuttPowerScore(0);
    setDriveDist(0);
    setDriveLieText('');
    setIronDist(0);
    setDidSink(false);
  }, []);

  const addDriveScore = (s: number) => {
    const next = [...driveScores, s];
    setDriveScores(next);
    if (next.length === 1) setPhase('drive_accuracy');
    else if (next.length === 2) setPhase('drive_skill');
    else {
      const dist = driveDistance(next[0]);
      const lie = driveLie(next[2]);
      setDriveDist(dist);
      setDriveLieText(lie);
      setPhase('drive_result');
    }
  };

  const addIronScore = (s: number) => {
    const next = [...ironScores, s];
    setIronScores(next);
    if (next.length === 1) setPhase('iron_accuracy');
    else if (next.length === 2) setPhase('iron_skill');
    else {
      const avg = next.reduce((a, b) => a + b, 0) / next.length;
      const dist = ironProximity(avg);
      setIronDist(dist);
      setPhase('iron_result');
    }
  };

  const lockPuttAim = (s: number) => {
    setPuttAimScore(s);
    setPhase('putt_power');
  };

  const releasePuttPower = (s: number) => {
    setPuttPowerScore(s);
    const sunk = puttSunk(puttAimScore, s, ironDist);
    setDidSink(sunk);
    setPhase('putt_result');
  };

  const finishHole = () => {
    const pts = holePoints(driveScores, ironScores, puttAimScore, puttPowerScore, didSink);
    const holeScore: HoleScore = {
      hole,
      driveScores,
      driveDistance: driveDist,
      driveLie: driveLieText,
      ironScores,
      ironDistance: ironDist,
      puttAimScore,
      puttPowerScore,
      sunk: didSink,
      totalPoints: pts,
    };
    const newScores = [...scores, holeScore];
    setScores(newScores);

    if (hole >= HOLE_COUNT) {
      const total = newScores.reduce((a, b) => a + b.totalPoints, 0);
      if (total > highScore) {
        setHighScore(total);
        setHighScoreState(total);
      }
      setPhase('game_over');
    } else {
      setHole(hole + 1);
      resetHole();
      setPhase('drive_power');
    }
  };

  const totalSoFar = scores.reduce((a, b) => a + b.totalPoints, 0);

  // --- TITLE ---
  if (phase === 'title') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Quick Play" onBack="/games" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <div className="anim-fade-up text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto">
              <span className="text-3xl font-black text-accent">9</span>
            </div>
            <div>
              <h2 className="text-3xl text-text font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Quick Play
              </h2>
              <p className="text-text-muted text-sm mt-2 max-w-[280px] mx-auto leading-relaxed">
                Drive, approach, and putt your way through 9 holes. Each shot tests your timing.
              </p>
            </div>
            {highScore > 0 && (
              <div className="bg-bg-card border border-border rounded-xl px-4 py-2 inline-block">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Best: </span>
                <span className="text-sm text-accent font-bold tabular-nums">{highScore} pts</span>
              </div>
            )}
          </div>
        </main>
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => { resetHole(); setHole(1); setScores([]); setPhase('drive_power'); }}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Tee Off
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GAME OVER ---
  if (phase === 'game_over') {
    const total = scores.reduce((a, b) => a + b.totalPoints, 0);
    const isNewHigh = total >= highScore;

    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Round Complete" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            {isNewHigh && <p className="text-accent text-xs font-bold uppercase tracking-widest mb-2">New Best</p>}
            <p className="text-5xl font-black tabular-nums text-accent">{total}</p>
            <p className="text-text-muted text-sm mt-1">points across {HOLE_COUNT} holes</p>
          </div>

          <div className="anim-fade-up space-y-2" style={{ animationDelay: '60ms' }}>
            {scores.map((s) => (
              <div key={s.hole} className="bg-bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm text-text font-semibold">Hole {s.hole}</span>
                  <span className="text-xs text-text-muted ml-2">{s.driveDistance} yds</span>
                  {s.sunk && <span className="text-[10px] text-accent ml-2 font-bold">Sunk</span>}
                </div>
                <span className="text-lg font-bold tabular-nums" style={{ color: scoreColor(s.totalPoints >= 80 ? 95 : s.totalPoints >= 60 ? 75 : s.totalPoints >= 40 ? 55 : 30) }}>
                  {s.totalPoints}
                </span>
              </div>
            ))}
          </div>
        </main>
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <button
              onClick={() => { resetHole(); setHole(1); setScores([]); setPhase('drive_power'); }}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/games')}
              className="w-full py-4 rounded-2xl font-semibold text-sm border border-border text-text-muted transition-all duration-200 hover:border-text-muted/40 active:scale-[0.98] min-h-[56px]"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Hole header ---
  const holeHeader = `Hole ${hole} / ${HOLE_COUNT}`;
  const phaseGroup = phase.startsWith('drive') ? 'drive' : phase.startsWith('iron') ? 'iron' : 'putt';

  const PhaseIndicator = () => (
    <div className="flex items-center justify-between mb-1">
      <div className="flex gap-2">
        {(['drive', 'iron', 'putt'] as const).map((g) => (
          <div
            key={g}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
              phaseGroup === g
                ? 'bg-accent/15 text-accent border border-accent/25'
                : 'text-text-muted/40'
            }`}
          >
            {g}
          </div>
        ))}
      </div>
      <span className="text-xs text-text-muted tabular-nums">{totalSoFar} pts</span>
    </div>
  );

  // --- DRIVE ---
  if (phase === 'drive_power' || phase === 'drive_accuracy' || phase === 'drive_skill') {
    const barIndex = phase === 'drive_power' ? 0 : phase === 'drive_accuracy' ? 1 : 2;
    const labels = ['Power', 'Accuracy', 'Skill'];

    return (
      <div className="min-h-screen flex flex-col">
        <Header title={holeHeader} onBack={() => setPhase('title')} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <PhaseIndicator />
          <div className="anim-fade-up text-center">
            <p className="text-text text-lg font-semibold">Drive</p>
            <p className="text-text-muted text-xs mt-1">Tap each bar at the sweet spot</p>
          </div>

          <div className="space-y-4 anim-fade-up" style={{ animationDelay: '40ms' }}>
            {labels.map((label, i) => (
              <div key={label}>
                {i < barIndex ? (
                  // Already locked
                  <div className="w-full space-y-2 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</span>
                      <span className="text-xs font-bold" style={{ color: scoreColor(driveScores[i]) }}>
                        {scoreLabel(driveScores[i])}
                      </span>
                    </div>
                    <div className="h-10 bg-bg-card border border-border rounded-xl" />
                  </div>
                ) : i === barIndex ? (
                  <OscillatingBar
                    key={`drive-${i}-${hole}`}
                    speed={diff.oscSpeed + i * 0.3}
                    sweetWidth={diff.sweetWidth - i * 2}
                    onTap={addDriveScore}
                    label={label}
                  />
                ) : (
                  // Not yet
                  <div className="w-full space-y-2 opacity-30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="h-10 bg-bg-card border border-border rounded-xl" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // --- DRIVE RESULT ---
  if (phase === 'drive_result') {
    const avg = driveScores.reduce((a, b) => a + b, 0) / driveScores.length;
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={holeHeader} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <PhaseIndicator />
          <div className="anim-fade-up text-center space-y-2">
            <p className="text-text-muted text-xs uppercase tracking-wider">Drive Result</p>
            <p className="text-4xl font-black tabular-nums text-text">{driveDist} <span className="text-lg text-text-muted font-medium">yds</span></p>
            <p className="text-sm font-semibold" style={{ color: lieColor(driveLieText) }}>{driveLieText}</p>
          </div>

          <div className="anim-fade-up bg-bg-card border border-border rounded-xl p-4 space-y-2" style={{ animationDelay: '60ms', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            {['Power', 'Accuracy', 'Skill'].map((label, i) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-text-muted">{label}</span>
                <span className="font-semibold tabular-nums" style={{ color: scoreColor(driveScores[i]) }}>{driveScores[i]}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
              <span className="text-text">Average</span>
              <span style={{ color: scoreColor(avg) }}>{Math.round(avg)}</span>
            </div>
          </div>
        </main>
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setPhase('iron_power')}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Approach Shot
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- IRON ---
  if (phase === 'iron_power' || phase === 'iron_accuracy' || phase === 'iron_skill') {
    const barIndex = phase === 'iron_power' ? 0 : phase === 'iron_accuracy' ? 1 : 2;
    const labels = ['Power', 'Accuracy', 'Skill'];

    return (
      <div className="min-h-screen flex flex-col">
        <Header title={holeHeader} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <PhaseIndicator />
          <div className="anim-fade-up text-center">
            <p className="text-text text-lg font-semibold">Approach</p>
            <p className="text-text-muted text-xs mt-1">Hold and release at the sweet spot</p>
          </div>

          <div className="anim-fade-up text-center text-xs text-text-muted" style={{ animationDelay: '20ms' }}>
            <span className="font-semibold" style={{ color: lieColor(driveLieText) }}>{driveLieText}</span>
            <span className="mx-1">-</span>
            <span>{driveDist} yds from tee</span>
          </div>

          <div className="space-y-4 anim-fade-up" style={{ animationDelay: '40ms' }}>
            {labels.map((label, i) => (
              <div key={label}>
                {i < barIndex ? (
                  <div className="w-full space-y-2 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</span>
                      <span className="text-xs font-bold" style={{ color: scoreColor(ironScores[i]) }}>
                        {scoreLabel(ironScores[i])}
                      </span>
                    </div>
                    <div className="h-10 bg-bg-card border border-border rounded-xl" />
                  </div>
                ) : i === barIndex ? (
                  <HoldReleaseBar
                    key={`iron-${i}-${hole}`}
                    speed={diff.fillSpeed + i * 0.15}
                    sweetWidth={diff.sweetWidth - i * 2}
                    onRelease={addIronScore}
                    label={label}
                  />
                ) : (
                  <div className="w-full space-y-2 opacity-30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="h-10 bg-bg-card border border-border rounded-xl" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // --- IRON RESULT ---
  if (phase === 'iron_result') {
    const avg = ironScores.reduce((a, b) => a + b, 0) / ironScores.length;
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={holeHeader} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <PhaseIndicator />
          <div className="anim-fade-up text-center space-y-2">
            <p className="text-text-muted text-xs uppercase tracking-wider">On the Green</p>
            <p className="text-4xl font-black tabular-nums text-text">{ironDist} <span className="text-lg text-text-muted font-medium">ft</span></p>
            <p className="text-sm text-text-muted">from the pin</p>
          </div>

          <div className="anim-fade-up bg-bg-card border border-border rounded-xl p-4 space-y-2" style={{ animationDelay: '60ms', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            {['Power', 'Accuracy', 'Skill'].map((label, i) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-text-muted">{label}</span>
                <span className="font-semibold tabular-nums" style={{ color: scoreColor(ironScores[i]) }}>{ironScores[i]}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
              <span className="text-text">Average</span>
              <span style={{ color: scoreColor(avg) }}>{Math.round(avg)}</span>
            </div>
          </div>
        </main>
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setPhase('putt_aim')}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Putt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PUTT AIM ---
  if (phase === 'putt_aim') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={holeHeader} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <PhaseIndicator />
          <div className="anim-fade-up text-center">
            <p className="text-text text-lg font-semibold">Read the Putt</p>
            <p className="text-text-muted text-xs mt-1">{ironDist} ft from the pin</p>
          </div>
          <div className="anim-fade-up" style={{ animationDelay: '40ms' }}>
            <PuttAim
              key={`aim-${hole}`}
              speed={diff.puttAimSpeed}
              onLock={lockPuttAim}
            />
          </div>
        </main>
      </div>
    );
  }

  // --- PUTT POWER ---
  if (phase === 'putt_power') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={holeHeader} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <PhaseIndicator />
          <div className="anim-fade-up text-center">
            <p className="text-text text-lg font-semibold">Stroke It</p>
            <p className="text-text-muted text-xs mt-1">Find the right distance</p>
          </div>
          <div className="anim-fade-up" style={{ animationDelay: '40ms' }}>
            <PuttPower
              key={`power-${hole}`}
              sweetWidth={diff.puttSweetWidth}
              onRelease={releasePuttPower}
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted">
              Aim: <span className="font-bold" style={{ color: scoreColor(puttAimScore) }}>{puttAimScore}</span>
            </p>
          </div>
        </main>
      </div>
    );
  }

  // --- PUTT RESULT ---
  if (phase === 'putt_result') {
    const pts = holePoints(driveScores, ironScores, puttAimScore, puttPowerScore, didSink);
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={holeHeader} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <PhaseIndicator />
          <div className="anim-fade-up text-center space-y-3">
            <p className="text-text-muted text-xs uppercase tracking-wider">Putt Result</p>
            {didSink ? (
              <>
                <p className="text-4xl font-black text-accent">Sunk It</p>
                <p className="text-text-muted text-sm">From {ironDist} ft</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-text-muted">Missed</p>
                <p className="text-text-muted text-sm">Close but not quite</p>
              </>
            )}
          </div>

          <div className="anim-fade-up bg-bg-card border border-border rounded-xl p-4 space-y-2" style={{ animationDelay: '60ms', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Aim</span>
              <span className="font-semibold tabular-nums" style={{ color: scoreColor(puttAimScore) }}>{puttAimScore}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Power</span>
              <span className="font-semibold tabular-nums" style={{ color: scoreColor(puttPowerScore) }}>{puttPowerScore}</span>
            </div>
            {didSink && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Sink Bonus</span>
                <span className="font-semibold tabular-nums text-accent">+20</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
              <span className="text-text">Hole Total</span>
              <span className="text-accent tabular-nums">{pts}</span>
            </div>
          </div>
        </main>
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={finishHole}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              {hole >= HOLE_COUNT ? 'Finish Round' : `Hole ${hole + 1}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
