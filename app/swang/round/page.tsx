'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ShotGradeBar from '@/components/ShotGradeBar';
import HoleResultPicker from '@/components/HoleResultPicker';
import BonusPointsPicker from '@/components/BonusPointsPicker';
import {
  SwangShot,
  SwangHole,
  SwangRound,
  SwangView,
  HoleResult,
  HOLE_RESULT_POINTS,
} from '@/lib/swang-types';
import {
  getActiveSwangRound,
  setActiveSwangRound,
  saveSwangRound,
} from '@/lib/swang-storage';

type PageView = 'setup' | 'hole' | 'round_summary';

const SHOT_CLUBS = ['Driver', 'Wood', 'Hybrid', 'Long Iron', 'Mid Iron', 'Short Iron', 'Wedge', 'Putter'];

export default function SwangRoundPage() {
  const router = useRouter();

  // Page-level state
  const [pageView, setPageView] = useState<PageView>('setup');
  const [course, setCourse] = useState('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [round, setRound] = useState<SwangRound | null>(null);
  const [currentHoleNum, setCurrentHoleNum] = useState(1);

  // Hole-level state machine
  const [holeView, setHoleView] = useState<SwangView>('shot_club');
  const [shots, setShots] = useState<SwangShot[]>([]);
  const [currentClub, setCurrentClub] = useState<string | null>(null);
  const [currentGrade, setCurrentGrade] = useState<number | null>(null);
  const [holeResult, setHoleResult] = useState<HoleResult | null>(null);
  const [bonuses, setBonuses] = useState<string[]>([]);

  useEffect(() => {
    const active = getActiveSwangRound();
    if (active && !active.completed) {
      setRound(active);
      setCourse(active.course);
      setHoleCount(active.hole_count);
      setCurrentHoleNum(active.holes.length + 1);
      setPageView('hole');
    }
  }, []);

  const persist = useCallback((r: SwangRound) => {
    setRound(r);
    setActiveSwangRound(r);
  }, []);

  const runningTotal = round ? round.totalPoints : 0;

  const resetHoleState = () => {
    setHoleView('shot_club');
    setShots([]);
    setCurrentClub(null);
    setCurrentGrade(null);
    setHoleResult(null);
    setBonuses([]);
  };

  const startRound = () => {
    const r: SwangRound = {
      id: `swang-${Date.now()}`,
      created_at: new Date().toISOString(),
      course: course.trim() || 'Round',
      holes: [],
      hole_count: holeCount,
      completed: false,
      totalPoints: 0,
    };
    persist(r);
    setCurrentHoleNum(1);
    resetHoleState();
    setPageView('hole');
  };

  // Shot flow
  const selectClub = (club: string) => {
    setCurrentClub(club);
    setCurrentGrade(null);
    setHoleView('shot_grade');
  };

  const gradeShot = (grade: number) => {
    setCurrentGrade(grade);
  };

  const confirmShot = () => {
    if (!currentClub || currentGrade === null) return;
    const shot: SwangShot = { club: currentClub, grade: currentGrade };
    const newShots = [...shots, shot];
    setShots(newShots);

    // If putter was graded, move to hole result
    if (currentClub === 'Putter') {
      setHoleView('hole_result');
    } else {
      setCurrentClub(null);
      setCurrentGrade(null);
      setHoleView('shot_club');
    }
  };

  const confirmResult = () => {
    if (!holeResult) return;
    setHoleView('bonus');
  };

  const confirmBonus = () => {
    if (!holeResult) return;
    setHoleView('hole_summary');
  };

  const shotTotal = shots.reduce((s, sh) => s + sh.grade, 0);
  const resultPoints = holeResult ? HOLE_RESULT_POINTS[holeResult] : 0;
  const bonusPoints = bonuses.length;
  const holeTotal = shotTotal + resultPoints + bonusPoints;

  const finishHole = () => {
    if (!round || !holeResult) return;

    const hole: SwangHole = {
      hole: currentHoleNum,
      shots,
      result: holeResult,
      bonuses,
      bonusPoints,
      shotTotal,
      resultPoints,
      holeTotal,
    };

    const updated: SwangRound = {
      ...round,
      holes: [...round.holes, hole],
      totalPoints: round.totalPoints + holeTotal,
    };

    if (currentHoleNum >= round.hole_count) {
      updated.completed = true;
      persist(updated);
      saveSwangRound(updated);
      setActiveSwangRound(null);
      setPageView('round_summary');
    } else {
      persist(updated);
      setCurrentHoleNum(currentHoleNum + 1);
      resetHoleState();
    }
  };

  // SETUP
  if (pageView === 'setup') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="New Swang Round" onBack="/swang" />
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

  // HOLE STATE MACHINE
  if (pageView === 'hole' && round) {
    const headerTitle = `Hole ${currentHoleNum} | Running Total: ${runningTotal >= 0 ? '+' : ''}${runningTotal} pts`;

    // SHOT CLUB SELECTION
    if (holeView === 'shot_club') {
      return (
        <div className="min-h-screen flex flex-col">
          <Header title={headerTitle} onBack="/swang" />
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
            <div className="anim-fade-up text-center">
              <p className="text-text text-lg font-semibold">Shot {shots.length + 1}</p>
              <p className="text-text-muted text-xs mt-1">Select your club</p>
            </div>

            {/* Shot log so far */}
            {shots.length > 0 && (
              <div className="anim-fade-up space-y-1">
                {shots.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-bg-card border border-border rounded-lg px-3 py-2">
                    <span className="text-xs text-text-muted">Shot {i + 1}: {s.club}</span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: s.grade <= 1 ? '#F87171' : s.grade <= 3 ? '#FACC15' : '#4ADE80' }}
                    >
                      {s.grade}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 anim-fade-up" style={{ animationDelay: '60ms' }}>
              {SHOT_CLUBS.map((club, i) => (
                <button
                  key={club}
                  onClick={() => selectClub(club)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="anim-fade-up bg-bg-card border border-border rounded-xl py-4 px-3 text-sm font-semibold text-text
                    transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 active:scale-[0.97] min-h-[56px]"
                >
                  {club}
                </button>
              ))}
            </div>
          </main>
        </div>
      );
    }

    // SHOT GRADE
    if (holeView === 'shot_grade' && currentClub) {
      return (
        <div className="min-h-screen flex flex-col">
          <Header title={headerTitle} onBack={() => { setCurrentClub(null); setHoleView('shot_club'); }} />
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-8">
            <div className="anim-fade-up text-center">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Shot {shots.length + 1}</p>
              <p className="text-text text-xl font-semibold">{currentClub}</p>
              <p className="text-text-muted text-xs mt-2">How was the shot?</p>
            </div>

            <div className="anim-fade-up" style={{ animationDelay: '60ms' }}>
              <ShotGradeBar value={currentGrade} onChange={gradeShot} />
            </div>
          </main>

          {currentGrade !== null && (
            <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
              <div className="max-w-lg mx-auto">
                <button
                  onClick={confirmShot}
                  className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
                >
                  {currentClub === 'Putter' ? 'Finish Shots' : 'Next Shot'}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // HOLE RESULT
    if (holeView === 'hole_result') {
      return (
        <div className="min-h-screen flex flex-col">
          <Header title={headerTitle} onBack={() => setHoleView('shot_club')} />
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
            <div className="anim-fade-up text-center">
              <p className="text-text text-lg font-semibold">Hole {currentHoleNum} Result</p>
              <p className="text-text-muted text-xs mt-1">How did you score?</p>
            </div>

            <div className="anim-fade-up" style={{ animationDelay: '60ms' }}>
              <HoleResultPicker value={holeResult} onChange={setHoleResult} />
            </div>
          </main>

          {holeResult && (
            <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
              <div className="max-w-lg mx-auto">
                <button
                  onClick={confirmResult}
                  className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // BONUS POINTS
    if (holeView === 'bonus') {
      return (
        <div className="min-h-screen flex flex-col">
          <Header title={headerTitle} onBack={() => setHoleView('hole_result')} />
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
            <div className="anim-fade-up text-center">
              <p className="text-text text-lg font-semibold">Bonus Points</p>
              <p className="text-text-muted text-xs mt-1">Any highlights this hole?</p>
            </div>

            <div className="anim-fade-up" style={{ animationDelay: '60ms' }}>
              <BonusPointsPicker selected={bonuses} onChange={setBonuses} />
            </div>
          </main>

          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
            <div className="max-w-lg mx-auto">
              <button
                onClick={confirmBonus}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
              >
                See Hole Summary
              </button>
            </div>
          </div>
        </div>
      );
    }

    // HOLE SUMMARY
    if (holeView === 'hole_summary') {
      return (
        <div className="min-h-screen flex flex-col">
          <Header title={headerTitle} />
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
            <div className="anim-fade-up text-center">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Hole {currentHoleNum}</p>
              <p
                className="text-5xl font-bold tabular-nums"
                style={{ color: holeTotal >= 0 ? '#4ADE80' : '#F87171' }}
              >
                {holeTotal >= 0 ? '+' : ''}{holeTotal}
              </p>
              <p className="text-text-muted text-xs mt-1">points</p>
            </div>

            {/* Breakdown */}
            <div className="anim-fade-up space-y-2" style={{ animationDelay: '60ms' }}>
              <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Shot grades ({shots.length} shots)</span>
                  <span className="text-text font-semibold tabular-nums">+{shotTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Hole result</span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: resultPoints >= 0 ? '#4ADE80' : '#F87171' }}
                  >
                    {resultPoints >= 0 ? '+' : ''}{resultPoints}
                  </span>
                </div>
                {bonusPoints > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Bonuses</span>
                    <span className="text-accent font-semibold tabular-nums">+{bonusPoints}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                  <span className="text-text">Hole Total</span>
                  <span style={{ color: holeTotal >= 0 ? '#4ADE80' : '#F87171' }}>
                    {holeTotal >= 0 ? '+' : ''}{holeTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Shot detail */}
            <div className="anim-fade-up space-y-1" style={{ animationDelay: '120ms' }}>
              {shots.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-bg-card border border-border rounded-lg px-3 py-2">
                  <span className="text-xs text-text-muted">Shot {i + 1}: {s.club}</span>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: s.grade <= 1 ? '#F87171' : s.grade <= 3 ? '#FACC15' : '#4ADE80' }}
                  >
                    {s.grade}
                  </span>
                </div>
              ))}
            </div>
          </main>

          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
            <div className="max-w-lg mx-auto">
              <button
                onClick={finishHole}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
              >
                {currentHoleNum >= (round?.hole_count ?? 18) ? 'Finish Round' : 'Next Hole'}
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // ROUND SUMMARY
  if (pageView === 'round_summary' && round) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Round Complete" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">{round.course}</p>
            <p
              className="text-5xl font-bold tabular-nums"
              style={{ color: round.totalPoints >= 0 ? '#4ADE80' : '#F87171' }}
            >
              {round.totalPoints >= 0 ? '+' : ''}{round.totalPoints}
            </p>
            <p className="text-text-muted text-sm mt-1">total points ({round.hole_count} holes)</p>
          </div>

          {/* Per-hole breakdown */}
          <div className="anim-fade-up space-y-2" style={{ animationDelay: '60ms' }}>
            {round.holes.map((h) => (
              <div key={h.hole} className="bg-bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm text-text font-semibold">Hole {h.hole}</span>
                  <span className="text-xs text-text-muted ml-2">{h.shots.length} shots</span>
                </div>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: h.holeTotal >= 0 ? '#4ADE80' : '#F87171' }}
                >
                  {h.holeTotal >= 0 ? '+' : ''}{h.holeTotal}
                </span>
              </div>
            ))}
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <button
              onClick={() => { setRound(null); setPageView('setup'); setCourse(''); resetHoleState(); }}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              New Round
            </button>
            <button
              onClick={() => router.push('/swang')}
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
