'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { SwingHole, SwingRound } from '@/lib/swing-types';
import {
  getActiveSwingRound,
  setActiveSwingRound,
  saveSwingRound,
} from '@/lib/swing-storage';

type View = 'setup' | 'playing' | 'summary';

export default function SwingRoundPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('setup');
  const [course, setCourse] = useState('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [round, setRound] = useState<SwingRound | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [par, setPar] = useState(4);
  const [score, setScore] = useState(4);

  useEffect(() => {
    const active = getActiveSwingRound();
    if (active && !active.completed) {
      setRound(active);
      setCourse(active.course);
      setHoleCount(active.hole_count);
      setCurrentHole(active.holes.length + 1);
      setView('playing');
    }
  }, []);

  const persist = useCallback((r: SwingRound) => {
    setRound(r);
    setActiveSwingRound(r);
  }, []);

  const startRound = () => {
    const r: SwingRound = {
      id: `swing-${Date.now()}`,
      created_at: new Date().toISOString(),
      course: course.trim() || 'Round',
      holes: [],
      hole_count: holeCount,
      completed: false,
    };
    persist(r);
    setCurrentHole(1);
    setPar(4);
    setScore(4);
    setView('playing');
  };

  const totalScore = round ? round.holes.reduce((s, h) => s + h.score, 0) : 0;
  const totalPar = round ? round.holes.reduce((s, h) => s + h.par, 0) : 0;
  const diff = totalScore - totalPar;

  const submitHole = () => {
    if (!round) return;
    const hole: SwingHole = { hole: currentHole, par, score };
    const updated = { ...round, holes: [...round.holes, hole] };

    if (currentHole >= round.hole_count) {
      updated.completed = true;
      persist(updated);
      saveSwingRound(updated);
      setActiveSwingRound(null);
      setView('summary');
    } else {
      persist(updated);
      setCurrentHole(currentHole + 1);
      setPar(4);
      setScore(4);
    }
  };

  // SETUP
  if (view === 'setup') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="New Round" onBack="/swing" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-8">
          <div className="anim-fade-up space-y-3">
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Course Name</p>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Pine Valley"
              className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-colors duration-200"
            />
          </div>

          <div className="anim-fade-up space-y-3" style={{ animationDelay: '60ms' }}>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Holes</p>
            <div className="flex gap-3">
              {([9, 18] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setHoleCount(n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]
                    ${holeCount === n
                      ? 'bg-accent text-bg'
                      : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                    }`}
                >
                  {n} Holes
                </button>
              ))}
            </div>
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={startRound}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Start Round
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING
  if (view === 'playing' && round) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          title={`Hole ${currentHole} | ${diff >= 0 ? '+' : ''}${diff} | Total: ${totalScore}`}
          onBack="/swing"
        />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-8">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">{round.course}</p>
            <p className="text-text text-lg font-semibold">Hole {currentHole} of {round.hole_count}</p>
          </div>

          {/* Par selector */}
          <div className="anim-fade-up space-y-3" style={{ animationDelay: '40ms' }}>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Par</p>
            <div className="flex gap-3">
              {([3, 4, 5] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPar(p); if (score < p - 2) setScore(p - 2); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]
                    ${par === p
                      ? 'bg-accent text-bg'
                      : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Score stepper */}
          <div className="anim-fade-up space-y-3" style={{ animationDelay: '80ms' }}>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Score</p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setScore(Math.max(1, score - 1))}
                className="w-14 h-14 rounded-xl bg-bg-card border border-border text-text text-xl font-bold flex items-center justify-center hover:border-text-muted/40 active:scale-95 transition-all duration-150"
              >
                -
              </button>
              <div className="text-center">
                <span
                  className="text-5xl font-bold tabular-nums"
                  style={{
                    color: score < par ? '#4ADE80' : score === par ? '#FACC15' : '#F87171',
                  }}
                >
                  {score}
                </span>
                <p className="text-xs text-text-muted mt-1">
                  {score < par - 1 ? 'Eagle or better' : score === par - 1 ? 'Birdie' : score === par ? 'Par' : score === par + 1 ? 'Bogey' : score === par + 2 ? 'Double Bogey' : `+${score - par}`}
                </p>
              </div>
              <button
                onClick={() => setScore(Math.min(15, score + 1))}
                className="w-14 h-14 rounded-xl bg-bg-card border border-border text-text text-xl font-bold flex items-center justify-center hover:border-text-muted/40 active:scale-95 transition-all duration-150"
              >
                +
              </button>
            </div>
          </div>

          {/* Previous holes mini scorecard */}
          {round.holes.length > 0 && (
            <div className="anim-fade-up space-y-2" style={{ animationDelay: '120ms' }}>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Scorecard</p>
              <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr] text-[11px] text-text-muted">
                  <div className="px-3 py-2 font-medium border-b border-border">Hole</div>
                  <div className="px-3 py-2 font-medium text-center border-b border-border">Par</div>
                  <div className="px-3 py-2 font-medium text-center border-b border-border">Score</div>
                  <div className="px-3 py-2 font-medium text-center border-b border-border">+/-</div>
                  {round.holes.map((h) => {
                    const d = h.score - h.par;
                    return (
                      <div key={h.hole} className="contents">
                        <div className="px-3 py-1.5 text-text">{h.hole}</div>
                        <div className="px-3 py-1.5 text-center">{h.par}</div>
                        <div className="px-3 py-1.5 text-center text-text font-medium">{h.score}</div>
                        <div
                          className="px-3 py-1.5 text-center font-medium"
                          style={{ color: d < 0 ? '#4ADE80' : d === 0 ? '#FACC15' : '#F87171' }}
                        >
                          {d > 0 ? `+${d}` : d}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={submitHole}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              {currentHole >= round.hole_count ? 'Finish Round' : 'Next Hole'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUMMARY
  if (view === 'summary' && round) {
    const birdies = round.holes.filter((h) => h.score < h.par).length;
    const pars = round.holes.filter((h) => h.score === h.par).length;
    const bogeys = round.holes.filter((h) => h.score > h.par).length;

    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Round Complete" />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">{round.course}</p>
            <p
              className="text-5xl font-bold tabular-nums"
              style={{ color: diff < 0 ? '#4ADE80' : diff === 0 ? '#FACC15' : '#F87171' }}
            >
              {totalScore}
            </p>
            <p className="text-text-muted text-sm mt-1">
              {diff > 0 ? `+${diff}` : diff} ({round.hole_count} holes)
            </p>
          </div>

          {/* Stats */}
          <div className="anim-fade-up grid grid-cols-3 gap-3" style={{ animationDelay: '60ms' }}>
            {[
              { label: 'Birdies', value: birdies, color: '#4ADE80' },
              { label: 'Pars', value: pars, color: '#FACC15' },
              { label: 'Bogeys+', value: bogeys, color: '#F87171' },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Full scorecard */}
          <div className="anim-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] text-[11px] text-text-muted">
                <div className="px-3 py-2 font-medium border-b border-border">Hole</div>
                <div className="px-3 py-2 font-medium text-center border-b border-border">Par</div>
                <div className="px-3 py-2 font-medium text-center border-b border-border">Score</div>
                <div className="px-3 py-2 font-medium text-center border-b border-border">+/-</div>
                {round.holes.map((h) => {
                  const d = h.score - h.par;
                  return (
                    <div key={h.hole} className="contents">
                      <div className="px-3 py-1.5 text-text">{h.hole}</div>
                      <div className="px-3 py-1.5 text-center">{h.par}</div>
                      <div className="px-3 py-1.5 text-center text-text font-medium">{h.score}</div>
                      <div
                        className="px-3 py-1.5 text-center font-medium"
                        style={{ color: d < 0 ? '#4ADE80' : d === 0 ? '#FACC15' : '#F87171' }}
                      >
                        {d > 0 ? `+${d}` : d}
                      </div>
                    </div>
                  );
                })}
                {/* Totals row */}
                <div className="contents border-t border-border">
                  <div className="px-3 py-2 text-text font-semibold border-t border-border">Total</div>
                  <div className="px-3 py-2 text-center font-semibold border-t border-border">{totalPar}</div>
                  <div className="px-3 py-2 text-center text-text font-semibold border-t border-border">{totalScore}</div>
                  <div
                    className="px-3 py-2 text-center font-semibold border-t border-border"
                    style={{ color: diff < 0 ? '#4ADE80' : diff === 0 ? '#FACC15' : '#F87171' }}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <button
              onClick={() => { setRound(null); setView('setup'); setCourse(''); }}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              New Round
            </button>
            <button
              onClick={() => router.push('/swing')}
              className="w-full py-4 rounded-2xl font-semibold text-base border border-border text-text-muted transition-all duration-200 hover:border-text-muted/40 active:scale-[0.98] min-h-[56px]"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
