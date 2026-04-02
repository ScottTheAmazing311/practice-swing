'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  HOLE_RESULT_LABELS,
  VIBE_LABELS,
} from '@/lib/swang-types';
import {
  getActiveSwangRound,
  setActiveSwangRound,
  saveSwangRound,
} from '@/lib/swang-storage';
import {
  getUsername,
  getCrewLeaderboard,
  addLeaderboardEntry,
  LeaderboardEntry,
} from '@/lib/swang-leaderboard';
import {
  searchCourses,
  hasApiKey,
  GolfCourse,
  GolfTeeBox,
} from '@/lib/golf-course-api';

type PageView = 'setup' | 'hole' | 'round_summary';

const SHOT_CLUBS = [
  { name: 'Driver', image: '/clubs/driver.png' },
  { name: 'Wood', image: '/clubs/wood.png' },
  { name: 'Hybrid', image: '/clubs/hybrid.png' },
  { name: 'Long Iron', image: '/clubs/iron.png' },
  { name: 'Mid Iron', image: '/clubs/iron.png' },
  { name: 'Short Iron', image: '/clubs/iron.png' },
  { name: 'Wedge', image: '/clubs/wedge.png' },
  { name: 'Putter', image: '/clubs/putter.png' },
];

const GRADE_COLORS = ['#F87171', '#FB923C', '#FACC15', '#A3E635', '#4ADE80', '#22D3EE'];

export default function SwangRoundPage() {
  const router = useRouter();
  const trackerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Page-level state
  const [pageView, setPageView] = useState<PageView>('setup');
  const [course, setCourse] = useState('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);

  // Course search state
  const [courseQuery, setCourseQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GolfCourse[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [selectedTee, setSelectedTee] = useState<GolfTeeBox | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const apiAvailable = hasApiKey();
  const [round, setRound] = useState<SwangRound | null>(null);
  const [currentHoleNum, setCurrentHoleNum] = useState(1);
  const [editingPrevious, setEditingPrevious] = useState(false);

  // Username & leaderboard
  const [username, setUsernameState] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Hole-level state machine
  const [holeView, setHoleView] = useState<SwangView>('shot_club');
  const [shots, setShots] = useState<SwangShot[]>([]);
  const [currentClub, setCurrentClub] = useState<string | null>(null);
  const [currentClubImage, setCurrentClubImage] = useState<string | null>(null);
  const [currentGrade, setCurrentGrade] = useState<number | null>(null);
  const [currentVibes, setCurrentVibes] = useState<number>(5);
  const [holeResult, setHoleResult] = useState<HoleResult | null>(null);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [bonusReason, setBonusReason] = useState<string | null>(null);

  useEffect(() => {
    setUsernameState(getUsername());
    const active = getActiveSwangRound();
    if (active && !active.completed) {
      setRound(active);
      setCourse(active.course);
      setHoleCount(active.hole_count);
      setCurrentHoleNum(active.holes.length + 1);
      setPageView('hole');
    }
  }, []);

  // Scroll tracker to show current hole
  useEffect(() => {
    if (trackerRef.current && pageView === 'hole') {
      const el = trackerRef.current.querySelector(`[data-hole="${currentHoleNum}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentHoleNum, pageView]);

  const persist = useCallback((r: SwangRound) => {
    setRound(r);
    setActiveSwangRound(r);
  }, []);

  // Debounced course search
  const handleSearch = (query: string) => {
    setCourseQuery(query);
    setSelectedCourse(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim() || !apiAvailable) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchCourses(query);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  };

  const pickCourse = (c: GolfCourse) => {
    setSelectedCourse(c);
    setSearchResults([]);
    setCourseQuery(c.course_name);
    setCourse(c.course_name);
    const tees = [...(c.tees?.male ?? []), ...(c.tees?.female ?? [])];
    const defaultTee = tees.find((t) => t.holes && t.holes.length > 0) ?? tees[0] ?? null;
    setSelectedTee(defaultTee);
    if (defaultTee?.number_of_holes) {
      setHoleCount(defaultTee.number_of_holes === 9 ? 9 : 18);
    }
  };

  const pickTee = (tee: GolfTeeBox) => {
    setSelectedTee(tee);
    if (tee.number_of_holes) {
      setHoleCount(tee.number_of_holes === 9 ? 9 : 18);
    }
  };

  const allTees = selectedCourse
    ? [...(selectedCourse.tees?.male ?? []), ...(selectedCourse.tees?.female ?? [])]
    : [];

  const runningTotal = round ? round.totalPoints : 0;

  // Current hole info from API data
  const currentHoleInfo = round?.holeInfo?.[currentHoleNum - 1] ?? null;

  const HoleInfoBar = () => {
    if (!currentHoleInfo) return null;
    return (
      <div className="anim-fade-up flex items-center justify-center gap-6 bg-bg-card border border-border rounded-xl px-4 py-2.5 mb-4"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <div className="text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Par</p>
          <p className="text-lg font-bold text-accent tabular-nums">{currentHoleInfo.par}</p>
        </div>
        {currentHoleInfo.yardage > 0 && (
          <div className="text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Yards</p>
            <p className="text-lg font-bold text-text tabular-nums">{currentHoleInfo.yardage}</p>
          </div>
        )}
        {currentHoleInfo.handicap > 0 && (
          <div className="text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Hcp</p>
            <p className="text-lg font-bold text-text-muted tabular-nums">{currentHoleInfo.handicap}</p>
          </div>
        )}
      </div>
    );
  };

  const [showAbandon, setShowAbandon] = useState(false);
  const [shared, setShared] = useState(false);

  const shareRound = async () => {
    if (!round) return;
    const holes = round.holes.map((h) => {
      const sign = h.holeTotal >= 0 ? '+' : '';
      return `Hole ${h.hole}: ${sign}${h.holeTotal} pts (${h.shots.length} shots)`;
    }).join('\n');

    const sign = round.totalPoints >= 0 ? '+' : '';
    const text = `Swang Round\n${round.course} - ${round.hole_count} holes\nTotal: ${sign}${round.totalPoints} pts\n\n${holes}\n\nswanggolf.com`;

    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch { /* ignore */ }
    }
  };

  const abandonRound = () => {
    setActiveSwangRound(null);
    setRound(null);
    setPageView('setup');
    setCourse('');
    setCourseQuery('');
    setSelectedCourse(null);
    setSelectedTee(null);
    setShowAbandon(false);
    resetHoleState();
  };

  const resetHoleState = () => {
    setHoleView('shot_club');
    setShots([]);
    setCurrentClub(null);
    setCurrentClubImage(null);
    setCurrentGrade(null);
    setHoleResult(null);
    setBonusPoints(0);
    setBonusReason(null);
    setCurrentVibes(5);
    setEditingPrevious(false);
  };

  // Load a completed hole back into edit state
  const loadHoleForEdit = (holeNum: number) => {
    if (!round) return;
    const hole = round.holes.find((h) => h.hole === holeNum);
    if (!hole) {
      // Jump to this hole as new (only if it's the next uncompleted)
      if (holeNum === round.holes.length + 1) {
        setCurrentHoleNum(holeNum);
        resetHoleState();
      }
      return;
    }
    setCurrentHoleNum(holeNum);
    setShots(hole.shots);
    setHoleResult(hole.result);
    setBonusPoints(hole.bonusPoints);
    setBonusReason(hole.bonuses[0] || null);
    setCurrentClub(null);
    setCurrentClubImage(null);
    setCurrentGrade(null);
    setHoleView('hole_summary');
    setEditingPrevious(true);
  };

  const startRound = () => {
    const holeInfo = selectedTee?.holes?.slice(0, holeCount).map((h) => ({
      par: h.par,
      yardage: h.yardage,
      handicap: h.handicap,
    }));

    const r: SwangRound = {
      id: `swang-${Date.now()}`,
      created_at: new Date().toISOString(),
      course: course.trim() || 'Round',
      holes: [],
      hole_count: holeCount,
      completed: false,
      totalPoints: 0,
      username: username || undefined,
      holeInfo: holeInfo && holeInfo.length > 0 ? holeInfo : undefined,
    };
    persist(r);
    setCurrentHoleNum(1);
    resetHoleState();
    setPageView('hole');
  };

  // Shot flow
  const selectClub = (club: string, image: string) => {
    setCurrentClub(club);
    setCurrentClubImage(image);
    setCurrentGrade(null);
    setHoleView('shot_grade');
  };

  const gradeShot = (grade: number) => {
    setCurrentGrade(grade);
  };

  const confirmShot = () => {
    if (!currentClub || currentGrade === null) return;
    const shot: SwangShot = { club: currentClub, grade: currentGrade, vibes: currentVibes };
    const newShots = [...shots, shot];
    setShots(newShots);

    if (currentClub === 'Putter') {
      setHoleView('hole_result');
    } else {
      setCurrentClub(null);
      setCurrentClubImage(null);
      setCurrentGrade(null);
      setCurrentVibes(5);
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
  const holeTotal = shotTotal + resultPoints + bonusPoints;

  const saveHoleAndAdvance = () => {
    if (!round || !holeResult) return;

    const hole: SwangHole = {
      hole: currentHoleNum,
      shots,
      result: holeResult,
      bonuses: bonusReason ? [bonusReason] : [],
      bonusPoints,
      shotTotal,
      resultPoints,
      holeTotal,
    };

    // Replace existing hole or append
    const existingIdx = round.holes.findIndex((h) => h.hole === currentHoleNum);
    let newHoles: SwangHole[];
    if (existingIdx >= 0) {
      newHoles = [...round.holes];
      newHoles[existingIdx] = hole;
    } else {
      newHoles = [...round.holes, hole];
    }

    const newTotal = newHoles.reduce((s, h) => s + h.holeTotal, 0);
    const nextHoleNum = newHoles.length + 1;
    const isFinished = editingPrevious ? false : currentHoleNum >= round.hole_count;

    const updated: SwangRound = {
      ...round,
      holes: newHoles,
      totalPoints: newTotal,
      completed: isFinished,
    };

    if (isFinished) {
      persist(updated);
      saveSwangRound(updated);
      setActiveSwangRound(null);
      // Add to leaderboard
      if (username) {
        addLeaderboardEntry({
          id: `lb-${updated.id}`,
          username,
          course: updated.course,
          totalPoints: updated.totalPoints,
          holeCount: updated.hole_count,
          date: updated.created_at,
          roundId: updated.id,
        });
      }
      setLeaderboard(getCrewLeaderboard());
      setPageView('round_summary');
    } else {
      persist(updated);
      setCurrentHoleNum(nextHoleNum > round.hole_count ? round.hole_count : nextHoleNum);
      resetHoleState();
    }
  };

  // Re-edit current hole from summary
  const reEditHole = () => {
    setShots([]);
    setHoleResult(null);
    setBonusPoints(0);
    setBonusReason(null);
    setCurrentClub(null);
    setCurrentClubImage(null);
    setCurrentGrade(null);
    setHoleView('shot_club');
  };

  // Number of completed holes
  const completedHoles = round ? round.holes.length : 0;
  // The "frontier" hole - next one to play
  const frontierHole = completedHoles + 1;

  // Hole tracker strip component
  const HoleTracker = () => {
    if (!round) return null;
    return (
      <div className="bg-bg/90 backdrop-blur-sm border-t border-border">
        <div
          ref={trackerRef}
          className="max-w-lg mx-auto px-3 py-2 flex gap-1 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {Array.from({ length: round.hole_count }, (_, i) => {
            const holeNum = i + 1;
            const completed = round.holes.find((h) => h.hole === holeNum);
            const isCurrent = holeNum === currentHoleNum;
            const isFuture = holeNum > frontierHole;

            return (
              <button
                key={holeNum}
                data-hole={holeNum}
                onClick={() => {
                  if (isFuture) return;
                  if (completed) {
                    loadHoleForEdit(holeNum);
                  } else if (holeNum === frontierHole) {
                    setCurrentHoleNum(holeNum);
                    resetHoleState();
                  }
                }}
                className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums
                  transition-all duration-150
                  ${isCurrent
                    ? 'bg-accent text-bg scale-110 shadow-md shadow-accent/20'
                    : completed
                      ? 'bg-bg-card border border-border text-text hover:border-accent/30 active:scale-95'
                      : isFuture
                        ? 'bg-bg-input/30 text-text-muted/30 cursor-not-allowed'
                        : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40 active:scale-95'
                  }`}
              >
                {completed && !isCurrent ? (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: completed.holeTotal >= 0 ? '#4ADE80' : '#F87171' }}
                  />
                ) : (
                  holeNum
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Shared: shot log with Wordle-style grade bars
  const ShotLog = ({ shotList }: { shotList: SwangShot[] }) => (
    <div className="space-y-2">
      {shotList.map((s, i) => {
        const clubData = SHOT_CLUBS.find((c) => c.name === s.club);
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg bg-cover bg-center border border-border shrink-0 opacity-60"
              style={{ backgroundImage: clubData ? `url(${clubData.image})` : undefined }}
            />
            <span className="text-[11px] text-text-muted w-16 truncate shrink-0">{s.club}</span>
            <div className="flex gap-[3px] flex-1">
              {Array.from({ length: 6 }, (_, j) => (
                <div
                  key={j}
                  className="h-5 flex-1 rounded-[3px] transition-all duration-200"
                  style={{
                    background: j <= s.grade ? GRADE_COLORS[s.grade] : '#1A2B1E',
                    opacity: j <= s.grade ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
            <span
              className="text-[11px] font-bold tabular-nums w-5 text-right"
              style={{ color: GRADE_COLORS[s.grade] }}
            >
              {s.grade}
            </span>
            {s.vibes !== undefined && (
              <span className="text-[9px] text-text-muted/60 w-12 text-right truncate" title={VIBE_LABELS[s.vibes]}>
                {VIBE_LABELS[s.vibes]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  // SETUP
  if (pageView === 'setup') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="New Swang Round" onBack="/swang" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-8">
          <div className="anim-fade-up space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Course</p>
              {apiAvailable && (
                <button
                  onClick={() => { setManualMode(!manualMode); setSelectedCourse(null); setSelectedTee(null); setSearchResults([]); }}
                  className="text-[10px] text-accent font-medium"
                >
                  {manualMode ? 'Search courses' : 'Enter manually'}
                </button>
              )}
            </div>

            {(!apiAvailable || manualMode) ? (
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. Pine Valley"
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-colors duration-200"
              />
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={courseQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search golf courses..."
                  className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-colors duration-200"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                  </div>
                )}

                {searchResults.length > 0 && !selectedCourse && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl overflow-hidden z-20 max-h-[300px] overflow-y-auto shadow-xl">
                    {searchResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => pickCourse(c)}
                        className="w-full px-4 py-3 text-left hover:bg-accent/5 transition-colors border-b border-border/50 last:border-b-0"
                      >
                        <p className="text-sm text-text font-medium">{c.course_name}</p>
                        <p className="text-[11px] text-text-muted">
                          {[c.location?.city, c.location?.state].filter(Boolean).join(', ')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedCourse && (
              <div className="bg-bg-card border border-accent/30 rounded-xl p-3 space-y-1">
                <p className="text-sm text-text font-semibold">{selectedCourse.course_name}</p>
                <p className="text-[11px] text-text-muted">
                  {[selectedCourse.location?.city, selectedCourse.location?.state].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Tee box selector */}
          {selectedCourse && allTees.length > 0 && (
            <div className="anim-fade-up space-y-3" style={{ animationDelay: '40ms' }}>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Tee Box</p>
              <div className="flex flex-wrap gap-2">
                {allTees.map((tee, i) => {
                  const active = selectedTee === tee;
                  return (
                    <button
                      key={i}
                      onClick={() => pickTee(tee)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[44px]
                        active:scale-95
                        ${active
                          ? 'bg-accent text-bg shadow-md'
                          : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                        }`}
                    >
                      <span className="block">{tee.tee_name}</span>
                      <span className={`block text-[10px] mt-0.5 ${active ? 'text-bg/60' : 'text-text-muted/60'}`}>
                        {tee.total_yards ? `${tee.total_yards} yds` : ''}{tee.par_total ? ` / Par ${tee.par_total}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Holes - show when no tee selected (manual mode or no API) */}
          {!selectedTee && (
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
          )}
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
    const headerTitle = `Hole ${currentHoleNum} | ${runningTotal >= 0 ? '+' : ''}${runningTotal} pts`;

    // SHOT CLUB SELECTION
    if (holeView === 'shot_club') {
      return (
        <div className="min-h-screen flex flex-col">
          <Header title={headerTitle} onBack="/swang" />
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 flex flex-col">
            <HoleInfoBar />
            <div className="anim-fade-up text-center mb-4">
              <p className="text-text text-lg font-semibold">Shot {shots.length + 1}</p>
              <p className="text-text-muted text-xs mt-1">Select your club</p>
            </div>

            {shots.length > 0 && (
              <div className="anim-fade-up mb-4">
                <ShotLog shotList={shots} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 flex-1">
              {SHOT_CLUBS.map((club, i) => (
                <button
                  key={club.name}
                  onClick={() => selectClub(club.name, club.image)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="anim-fade-up relative overflow-hidden rounded-2xl
                    min-h-[100px] border-2 border-border transition-all duration-200 ease-out
                    active:scale-[0.97] group hover:border-text-muted/30"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-55 transition-opacity duration-200"
                    style={{ backgroundImage: `url(${club.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="relative z-10 flex flex-col justify-end h-full p-3">
                    <span className="text-sm font-semibold leading-tight text-text/90">
                      {club.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </main>
          <div>
            <HoleTracker />
            <div className="max-w-lg mx-auto px-4 py-2">
              {!showAbandon ? (
                <button
                  onClick={() => setShowAbandon(true)}
                  className="w-full py-2 text-sm text-text-muted/50 transition-all duration-200 hover:text-danger active:scale-[0.98]"
                >
                  Abandon Round
                </button>
              ) : (
                <div className="bg-bg-card border border-danger/30 rounded-2xl p-4 space-y-3">
                  <p className="text-sm text-text text-center font-medium">Abandon this round? Progress will be lost.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAbandon(false)}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm border border-border text-text-muted transition-all duration-200 hover:border-text-muted/40 active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={abandonRound}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm bg-danger text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                    >
                      Abandon
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // SHOT GRADE + VIBES
    if (holeView === 'shot_grade' && currentClub) {
      const vibeColor = currentVibes <= 2 ? '#F87171' : currentVibes <= 4 ? '#FB923C' : currentVibes <= 6 ? '#FACC15' : currentVibes <= 8 ? '#4ADE80' : '#22D3EE';
      const dialAngle = -135 + (currentVibes / 10) * 270;
      return (
        <div className="min-h-screen flex flex-col">
          <Header title={headerTitle} onBack={() => { setCurrentClub(null); setCurrentClubImage(null); setCurrentVibes(5); setHoleView('shot_club'); }} />
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
            <HoleInfoBar />
            <div className="anim-fade-up relative w-full aspect-square max-w-[140px] mx-auto rounded-2xl overflow-hidden border border-border">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-60"
                style={{ backgroundImage: currentClubImage ? `url(${currentClubImage})` : undefined }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/90 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-text-muted text-[10px] uppercase tracking-wider">Shot {shots.length + 1}</p>
                <p className="text-text text-lg font-semibold">{currentClub}</p>
              </div>
            </div>

            <div className="anim-fade-up" style={{ animationDelay: '80ms' }}>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3 text-center">
                How was the shot?
              </p>
              <ShotGradeBar value={currentGrade} onChange={gradeShot} />
            </div>

            {currentGrade !== null && (
              <div className="anim-fade-up" style={{ animationDelay: '120ms' }}>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3 text-center">
                  Yeah but how were the vibes?
                </p>

                <div className="flex flex-col items-center">
                  <div className="relative w-44 h-24 mb-1">
                    <svg viewBox="0 0 200 110" className="w-full h-full">
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1A2B1E" strokeWidth="12" strokeLinecap="round" />
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={vibeColor} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${(currentVibes / 10) * 251.3} 251.3`} className="transition-all duration-300" />
                      {Array.from({ length: 11 }, (_, i) => {
                        const angle = (-180 + (i / 10) * 180) * (Math.PI / 180);
                        const x1 = 100 + 90 * Math.cos(angle);
                        const y1 = 100 + 90 * Math.sin(angle);
                        const x2 = 100 + 83 * Math.cos(angle);
                        const y2 = 100 + 83 * Math.sin(angle);
                        return (
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={i <= currentVibes ? vibeColor : '#2A3B2E'}
                            strokeWidth="2" strokeLinecap="round" className="transition-all duration-300" />
                        );
                      })}
                      <g transform={`rotate(${dialAngle}, 100, 100)`} className="transition-transform duration-300">
                        <line x1="100" y1="100" x2="100" y2="30" stroke={vibeColor} strokeWidth="3" strokeLinecap="round" />
                        <circle cx="100" cy="100" r="6" fill={vibeColor} />
                        <circle cx="100" cy="100" r="3" fill="#0F1A12" />
                      </g>
                    </svg>
                  </div>

                  <p className="text-xl font-bold tracking-tight transition-all duration-300" style={{ color: vibeColor }}>
                    {VIBE_LABELS[currentVibes]}
                  </p>

                  <div className="w-full mt-4 px-2">
                    <input
                      type="range" min={0} max={10} step={1} value={currentVibes}
                      onChange={(e) => setCurrentVibes(parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${vibeColor} 0%, ${vibeColor} ${currentVibes * 10}%, #1A2B1E ${currentVibes * 10}%, #1A2B1E 100%)`,
                        accentColor: vibeColor,
                      }}
                    />
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-[9px] text-text-muted">Awful</span>
                      <span className="text-[9px] text-text-muted">Goated</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {currentGrade !== null && (
            <div className="sticky bottom-0">
              <div className="p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
                <div className="max-w-lg mx-auto">
                  <button
                    onClick={confirmShot}
                    className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
                  >
                    {currentClub === 'Putter' ? 'Finish Shots' : 'Next Shot'}
                  </button>
                </div>
              </div>
              <HoleTracker />
            </div>
          )}
          {currentGrade === null && <HoleTracker />}
        </div>
      );
    }

    // HOLE RESULT
    if (holeView === 'hole_result') {
      return (
        <div className="min-h-screen flex flex-col">
          <Header title={headerTitle} onBack={() => setHoleView('shot_club')} />
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
            <HoleInfoBar />
            <div className="anim-fade-up text-center">
              <p className="text-text text-lg font-semibold">Hole {currentHoleNum} Result</p>
              <p className="text-text-muted text-xs mt-1">How did you score?</p>
            </div>

            <div className="anim-fade-up" style={{ animationDelay: '40ms' }}>
              <ShotLog shotList={shots} />
            </div>

            <div className="anim-fade-up" style={{ animationDelay: '80ms' }}>
              <HoleResultPicker value={holeResult} onChange={setHoleResult} />
            </div>
          </main>

          {holeResult ? (
            <div className="sticky bottom-0">
              <div className="p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
                <div className="max-w-lg mx-auto">
                  <button
                    onClick={confirmResult}
                    className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
                  >
                    Continue
                  </button>
                </div>
              </div>
              <HoleTracker />
            </div>
          ) : (
            <HoleTracker />
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
            <HoleInfoBar />
            <div className="anim-fade-up text-center">
              <p className="text-text text-lg font-semibold">Bonus Points</p>
              <p className="text-text-muted text-xs mt-1">Any highlights this hole?</p>
            </div>

            <div className="anim-fade-up" style={{ animationDelay: '60ms' }}>
              <BonusPointsPicker points={bonusPoints} reason={bonusReason} onPointsChange={setBonusPoints} onReasonChange={setBonusReason} />
            </div>
          </main>

          <div className="sticky bottom-0">
            <div className="p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
              <div className="max-w-lg mx-auto">
                <button
                  onClick={confirmBonus}
                  className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
                >
                  See Hole Summary
                </button>
              </div>
            </div>
            <HoleTracker />
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
            <HoleInfoBar />
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

            <div className="anim-fade-up" style={{ animationDelay: '60ms' }}>
              <div
                className="bg-bg-card border border-border rounded-2xl p-4 space-y-3"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Shot grades ({shots.length} shots)</span>
                  <span className="text-text font-semibold tabular-nums">+{shotTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">
                    {holeResult ? HOLE_RESULT_LABELS[holeResult] : 'Result'}
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: resultPoints >= 0 ? '#4ADE80' : '#F87171' }}
                  >
                    {resultPoints >= 0 ? '+' : ''}{resultPoints}
                  </span>
                </div>
                {bonusPoints > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Bonus{bonusReason ? ` (${bonusReason})` : ''}</span>
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

            <div className="anim-fade-up" style={{ animationDelay: '120ms' }}>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3">Shot Breakdown</p>
              <ShotLog shotList={shots} />
            </div>
          </main>

          <div className="sticky bottom-0">
            <div className="p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
              <div className="max-w-lg mx-auto flex gap-3">
                {editingPrevious && (
                  <button
                    onClick={reEditHole}
                    className="flex-1 py-4 rounded-2xl font-semibold text-base border border-border text-text-muted transition-all duration-200 hover:border-text-muted/40 active:scale-[0.98] min-h-[56px]"
                  >
                    Re-do Hole
                  </button>
                )}
                <button
                  onClick={saveHoleAndAdvance}
                  className="flex-1 py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
                >
                  {editingPrevious
                    ? 'Save Changes'
                    : currentHoleNum >= (round?.hole_count ?? 18)
                      ? 'Finish Round'
                      : 'Next Hole'}
                </button>
              </div>
            </div>
            <HoleTracker />
          </div>
        </div>
      );
    }
  }

  // ROUND SUMMARY
  if (pageView === 'round_summary' && round) {
    // Find current user's rank
    const userRank = username
      ? leaderboard.findIndex((e) => e.roundId === round.id) + 1
      : 0;

    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Round Complete" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          {/* Score hero */}
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">{round.course}</p>
            <p
              className="text-5xl font-bold tabular-nums"
              style={{ color: round.totalPoints >= 0 ? '#4ADE80' : '#F87171' }}
            >
              {round.totalPoints >= 0 ? '+' : ''}{round.totalPoints}
            </p>
            <p className="text-text-muted text-sm mt-1">total points ({round.hole_count} holes)</p>
            {username && (
              <p className="text-accent text-xs font-bold mt-2 tracking-widest">{username}</p>
            )}
          </div>

          {/* Arcade Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="anim-fade-up" style={{ animationDelay: '80ms' }}>
              <div
                className="bg-bg-card border border-border rounded-2xl overflow-hidden"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                {/* Leaderboard header */}
                <div className="px-4 py-3 border-b border-border bg-accent/5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-accent font-bold uppercase tracking-widest">Leaderboard</p>
                    <p className="text-[10px] text-text-muted">All Rounds</p>
                  </div>
                </div>

                {/* Entries */}
                <div className="divide-y divide-border/50">
                  {leaderboard.slice(0, 10).map((entry, i) => {
                    const rank = i + 1;
                    const isCurrentRound = entry.roundId === round.id;
                    const isTopThree = rank <= 3;
                    const rankColors = ['#FACC15', '#C0C0C0', '#CD7F32'];

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 ${
                          isCurrentRound ? 'bg-accent/10' : ''
                        }`}
                      >
                        {/* Rank */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black tabular-nums shrink-0"
                          style={{
                            background: isTopThree ? rankColors[rank - 1] + '20' : 'transparent',
                            color: isTopThree ? rankColors[rank - 1] : '#6B7280',
                            border: isTopThree ? `1px solid ${rankColors[rank - 1]}40` : '1px solid transparent',
                          }}
                        >
                          {rank}
                        </div>

                        {/* Username */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold tracking-wider truncate ${
                            isCurrentRound ? 'text-accent' : 'text-text'
                          }`}>
                            {entry.username}
                          </p>
                          <p className="text-[10px] text-text-muted truncate">
                            {entry.course} - {entry.holeCount}h
                          </p>
                        </div>

                        {/* Score */}
                        <p
                          className="text-lg font-black tabular-nums shrink-0"
                          style={{ color: entry.totalPoints >= 0 ? '#4ADE80' : '#F87171' }}
                        >
                          {entry.totalPoints >= 0 ? '+' : ''}{entry.totalPoints}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Your rank callout */}
                {username && userRank > 0 && (
                  <div className="px-4 py-2 border-t border-border bg-accent/5">
                    <p className="text-[11px] text-text-muted text-center">
                      You ranked <span className="text-accent font-bold">#{userRank}</span> of {leaderboard.length}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No username prompt */}
          {!username && (
            <div className="anim-fade-up text-center py-4" style={{ animationDelay: '80ms' }}>
              <p className="text-text-muted text-xs mb-2">Set a username to join the leaderboard</p>
              <button
                onClick={() => router.push('/swang/leaderboard')}
                className="text-accent text-sm font-medium hover:underline"
              >
                Set Username
              </button>
            </div>
          )}

          {/* Hole breakdown */}
          <div className="anim-fade-up space-y-2" style={{ animationDelay: '140ms' }}>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-3">Hole Breakdown</p>
            {round.holes.map((h) => (
              <div
                key={h.hole}
                className="bg-bg-card border border-border rounded-xl px-4 py-3"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm text-text font-semibold">Hole {h.hole}</span>
                    <span className="text-xs text-text-muted ml-2">{h.shots.length} shots</span>
                    {h.bonuses.length > 0 && (
                      <span className="text-[10px] text-accent ml-2">+{h.bonusPoints} bonus</span>
                    )}
                  </div>
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: h.holeTotal >= 0 ? '#4ADE80' : '#F87171' }}
                  >
                    {h.holeTotal >= 0 ? '+' : ''}{h.holeTotal}
                  </span>
                </div>
                <div className="flex gap-[2px]">
                  {h.shots.map((s, j) => (
                    <div
                      key={j}
                      className="h-3 flex-1 rounded-[2px]"
                      style={{ background: GRADE_COLORS[s.grade], opacity: 0.7 }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <button
              onClick={shareRound}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              {shared ? 'Copied' : 'Share Round'}
            </button>
            <button
              onClick={() => { setRound(null); setPageView('setup'); setCourse(''); resetHoleState(); }}
              className="w-full py-4 rounded-2xl font-semibold text-sm border border-border text-text-muted transition-all duration-200 hover:border-accent/30 hover:text-accent active:scale-[0.98] min-h-[56px]"
            >
              New Round
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/swang/leaderboard')}
                className="flex-1 py-4 rounded-2xl font-semibold text-sm border border-border text-text-muted transition-all duration-200 hover:border-accent/30 hover:text-accent active:scale-[0.98] min-h-[56px]"
              >
                Leaderboard
              </button>
              <button
                onClick={() => router.push('/swang')}
                className="flex-1 py-4 rounded-2xl font-semibold text-sm border border-border text-text-muted transition-all duration-200 hover:border-text-muted/40 active:scale-[0.98] min-h-[56px]"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
