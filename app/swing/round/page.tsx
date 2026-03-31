'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { SwingHole, SwingRound } from '@/lib/swing-types';
import {
  getActiveSwingRound,
  setActiveSwingRound,
  saveSwingRound,
} from '@/lib/swing-storage';
import {
  searchCourses,
  hasApiKey,
  GolfCourse,
  GolfTeeBox,
} from '@/lib/golf-course-api';

type View = 'setup' | 'scorecard' | 'edit_hole' | 'summary';

function scoreLabel(score: number, par: number): string {
  const d = score - par;
  if (d <= -2) return 'Eagle+';
  if (d === -1) return 'Birdie';
  if (d === 0) return 'Par';
  if (d === 1) return 'Bogey';
  if (d === 2) return 'Dbl Bogey';
  return `+${d}`;
}

function scoreColor(score: number, par: number): string {
  const d = score - par;
  if (d <= -2) return '#22D3EE';
  if (d === -1) return '#4ADE80';
  if (d === 0) return '#FACC15';
  if (d === 1) return '#FB923C';
  return '#F87171';
}

export default function SwingRoundPage() {
  const router = useRouter();
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [view, setView] = useState<View>('setup');

  // Setup state
  const [courseQuery, setCourseQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GolfCourse[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [selectedTee, setSelectedTee] = useState<GolfTeeBox | null>(null);
  const [courseName, setCourseName] = useState('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [manualMode, setManualMode] = useState(false);

  // Round state
  const [round, setRound] = useState<SwingRound | null>(null);

  // Edit hole state
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [editPar, setEditPar] = useState(4);
  const [editScore, setEditScore] = useState(4);

  const apiAvailable = hasApiKey();

  useEffect(() => {
    const active = getActiveSwingRound();
    if (active && !active.completed) {
      setRound(active);
      setCourseName(active.course);
      setHoleCount(active.hole_count);
      setView('scorecard');
    }
  }, []);

  const persist = useCallback((r: SwingRound) => {
    setRound(r);
    setActiveSwingRound(r);
  }, []);

  // Debounced course search
  const handleSearch = (query: string) => {
    setCourseQuery(query);
    setSelectedCourse(null);
    setSelectedTee(null);
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

  const pickCourse = (course: GolfCourse) => {
    setSelectedCourse(course);
    setSearchResults([]);
    setCourseQuery(course.course_name);
    setCourseName(course.course_name);
    // Auto-select first male tee with holes
    const tees = [...(course.tees?.male ?? []), ...(course.tees?.female ?? [])];
    const defaultTee = tees.find((t) => t.holes && t.holes.length > 0) ?? tees[0] ?? null;
    setSelectedTee(defaultTee);
    if (defaultTee) {
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

  const startRound = () => {
    const holes: SwingHole[] = [];
    const count = holeCount;

    for (let i = 0; i < count; i++) {
      const apiHole = selectedTee?.holes?.[i];
      holes.push({
        hole: i + 1,
        par: apiHole?.par ?? 4,
        score: 0, // 0 = not yet scored
        yardage: apiHole?.yardage,
        handicap: apiHole?.handicap,
      });
    }

    const r: SwingRound = {
      id: `swing-${Date.now()}`,
      created_at: new Date().toISOString(),
      course: courseName.trim() || 'Round',
      holes,
      hole_count: count,
      completed: false,
    };
    persist(r);
    setView('scorecard');
  };

  const openHoleEditor = (holeNum: number) => {
    if (!round) return;
    const hole = round.holes.find((h) => h.hole === holeNum);
    if (!hole) return;
    setEditingHole(holeNum);
    setEditPar(hole.par);
    setEditScore(hole.score || hole.par);
    setView('edit_hole');
  };

  const saveHoleEdit = () => {
    if (!round || editingHole === null) return;
    const newHoles = round.holes.map((h) =>
      h.hole === editingHole ? { ...h, par: editPar, score: editScore } : h
    );
    const updated = { ...round, holes: newHoles };
    persist(updated);
    setEditingHole(null);
    setView('scorecard');
  };

  const finishRound = () => {
    if (!round) return;
    const updated = { ...round, completed: true };
    persist(updated);
    saveSwingRound(updated);
    setActiveSwingRound(null);
    setView('summary');
  };

  // Computed
  const scoredHoles = round?.holes.filter((h) => h.score > 0) ?? [];
  const totalScore = scoredHoles.reduce((s, h) => s + h.score, 0);
  const totalPar = scoredHoles.reduce((s, h) => s + h.par, 0);
  const diff = totalScore - totalPar;
  const allScored = round ? round.holes.every((h) => h.score > 0) : false;

  // SETUP
  if (view === 'setup') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="New Round" onBack="/swing" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          {/* Course search */}
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
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
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

                {/* Search results dropdown */}
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

            {/* Selected course info */}
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

          {/* Holes */}
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

          {/* Course preview if tee selected */}
          {selectedTee && selectedTee.holes && selectedTee.holes.length > 0 && (
            <div className="anim-fade-up space-y-2" style={{ animationDelay: '80ms' }}>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Course Layout</p>
              <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="flex min-w-max">
                    {/* Header column */}
                    <div className="shrink-0 w-12 border-r border-border">
                      <div className="px-2 py-1.5 text-[10px] text-text-muted font-medium border-b border-border">Hole</div>
                      <div className="px-2 py-1.5 text-[10px] text-text-muted font-medium border-b border-border">Par</div>
                      <div className="px-2 py-1.5 text-[10px] text-text-muted font-medium">Yds</div>
                    </div>
                    {/* Hole columns */}
                    {selectedTee.holes.slice(0, holeCount).map((h, i) => (
                      <div key={i} className="shrink-0 w-9 text-center border-r border-border/30 last:border-r-0">
                        <div className="py-1.5 text-[10px] text-text font-medium border-b border-border">{i + 1}</div>
                        <div className="py-1.5 text-[10px] text-accent font-semibold border-b border-border">{h.par}</div>
                        <div className="py-1.5 text-[10px] text-text-muted">{h.yardage}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={startRound}
              disabled={!courseName.trim() && !selectedCourse}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 min-h-[56px]"
            >
              Start Round
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VISUAL SCORECARD
  if (view === 'scorecard' && round) {
    const frontNine = round.holes.filter((h) => h.hole <= 9);
    const backNine = round.holes.filter((h) => h.hole > 9);

    const ScorecardSection = ({ holes, label }: { holes: SwingHole[]; label: string }) => {
      if (holes.length === 0) return null;
      const sectionPar = holes.reduce((s, h) => s + h.par, 0);
      const sectionScore = holes.filter((h) => h.score > 0).reduce((s, h) => s + h.score, 0);
      const scored = holes.filter((h) => h.score > 0);

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</p>
            {scored.length > 0 && (
              <p className="text-xs text-text-muted tabular-nums">
                {sectionScore} ({sectionScore - sectionPar >= 0 ? '+' : ''}{sectionScore - sectionPar})
              </p>
            )}
          </div>
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            <div className="overflow-x-auto">
              <div className="flex min-w-max">
                {/* Label column */}
                <div className="shrink-0 w-12 border-r border-border">
                  <div className="px-2 py-2 text-[10px] text-text-muted font-medium border-b border-border">Hole</div>
                  {holes[0]?.yardage !== undefined && (
                    <div className="px-2 py-1.5 text-[10px] text-text-muted font-medium border-b border-border">Yds</div>
                  )}
                  {holes[0]?.handicap !== undefined && (
                    <div className="px-2 py-1.5 text-[10px] text-text-muted font-medium border-b border-border">Hcp</div>
                  )}
                  <div className="px-2 py-1.5 text-[10px] text-text-muted font-medium border-b border-border">Par</div>
                  <div className="px-2 py-2 text-[10px] text-text font-semibold">Score</div>
                </div>
                {/* Hole columns */}
                {holes.map((h) => {
                  const scored = h.score > 0;
                  return (
                    <button
                      key={h.hole}
                      onClick={() => openHoleEditor(h.hole)}
                      className="shrink-0 w-9 text-center border-r border-border/30 last:border-r-0 hover:bg-accent/5 transition-colors active:bg-accent/10"
                    >
                      <div className="py-2 text-[10px] text-text font-medium border-b border-border">{h.hole}</div>
                      {h.yardage !== undefined && (
                        <div className="py-1.5 text-[10px] text-text-muted border-b border-border">{h.yardage}</div>
                      )}
                      {h.handicap !== undefined && (
                        <div className="py-1.5 text-[10px] text-text-muted border-b border-border">{h.handicap}</div>
                      )}
                      <div className="py-1.5 text-[10px] text-accent font-semibold border-b border-border">{h.par}</div>
                      <div className="py-2">
                        {scored ? (
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold"
                            style={{
                              background: `${scoreColor(h.score, h.par)}20`,
                              color: scoreColor(h.score, h.par),
                              boxShadow: `0 0 0 1.5px ${scoreColor(h.score, h.par)}40`,
                            }}
                          >
                            {h.score}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-text-muted/30 text-[11px] text-text-muted/40">
                            -
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {/* Totals column */}
                <div className="shrink-0 w-11 text-center border-l border-border bg-bg-input/30">
                  <div className="py-2 text-[10px] text-text-muted font-semibold border-b border-border">Tot</div>
                  {holes[0]?.yardage !== undefined && (
                    <div className="py-1.5 text-[10px] text-text-muted border-b border-border">
                      {holes.reduce((s, h) => s + (h.yardage ?? 0), 0)}
                    </div>
                  )}
                  {holes[0]?.handicap !== undefined && (
                    <div className="py-1.5 text-[10px] text-text-muted border-b border-border" />
                  )}
                  <div className="py-1.5 text-[10px] text-accent font-bold border-b border-border">{sectionPar}</div>
                  <div className="py-2 text-[11px] font-bold" style={{ color: scored.length > 0 ? scoreColor(sectionScore, sectionPar) : '#8CA394' }}>
                    {scored.length > 0 ? sectionScore : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen flex flex-col">
        <Header title={round.course} onBack="/swing" />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">
          {/* Summary banner */}
          <div className="anim-fade-up flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            <div>
              <p className="text-xs text-text-muted">{scoredHoles.length} of {round.hole_count} holes</p>
            </div>
            {scoredHoles.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-text-muted">Score</p>
                  <p className="text-lg font-bold tabular-nums text-text">{totalScore}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">+/-</p>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: diff < 0 ? '#4ADE80' : diff === 0 ? '#FACC15' : '#F87171' }}
                  >
                    {diff > 0 ? `+${diff}` : diff === 0 ? 'E' : diff}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Front 9 */}
          <div className="anim-fade-up" style={{ animationDelay: '60ms' }}>
            <ScorecardSection holes={frontNine} label={round.hole_count === 18 ? 'Front 9' : 'Holes'} />
          </div>

          {/* Back 9 */}
          {backNine.length > 0 && (
            <div className="anim-fade-up" style={{ animationDelay: '120ms' }}>
              <ScorecardSection holes={backNine} label="Back 9" />
            </div>
          )}

          {/* Legend */}
          <div className="anim-fade-up flex flex-wrap gap-3 justify-center pt-2" style={{ animationDelay: '180ms' }}>
            {[
              { label: 'Eagle+', color: '#22D3EE' },
              { label: 'Birdie', color: '#4ADE80' },
              { label: 'Par', color: '#FACC15' },
              { label: 'Bogey', color: '#FB923C' },
              { label: 'Dbl+', color: '#F87171' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: `${l.color}30`, boxShadow: `0 0 0 1.5px ${l.color}50` }} />
                <span className="text-[10px] text-text-muted">{l.label}</span>
              </div>
            ))}
          </div>
        </main>

        {allScored && (
          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
            <div className="max-w-lg mx-auto">
              <button
                onClick={finishRound}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
              >
                Finish Round
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // EDIT HOLE
  if (view === 'edit_hole' && round && editingHole !== null) {
    const hole = round.holes.find((h) => h.hole === editingHole)!;

    return (
      <div className="min-h-screen flex flex-col">
        <Header title={`Hole ${editingHole}`} onBack={() => { setEditingHole(null); setView('scorecard'); }} />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-8">
          {/* Hole info */}
          {(hole.yardage || hole.handicap) && (
            <div className="anim-fade-up flex justify-center gap-6">
              {hole.yardage && (
                <div className="text-center">
                  <p className="text-xs text-text-muted">Yards</p>
                  <p className="text-lg text-text font-semibold tabular-nums">{hole.yardage}</p>
                </div>
              )}
              {hole.handicap && (
                <div className="text-center">
                  <p className="text-xs text-text-muted">Handicap</p>
                  <p className="text-lg text-text font-semibold tabular-nums">{hole.handicap}</p>
                </div>
              )}
            </div>
          )}

          {/* Par selector */}
          <div className="anim-fade-up space-y-3" style={{ animationDelay: '40ms' }}>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Par</p>
            <div className="flex gap-3">
              {([3, 4, 5] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setEditPar(p)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]
                    ${editPar === p
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
                onClick={() => setEditScore(Math.max(1, editScore - 1))}
                className="w-14 h-14 rounded-xl bg-bg-card border border-border text-text text-xl font-bold flex items-center justify-center hover:border-text-muted/40 active:scale-95 transition-all duration-150"
              >
                -
              </button>
              <div className="text-center">
                <span
                  className="text-5xl font-bold tabular-nums"
                  style={{ color: scoreColor(editScore, editPar) }}
                >
                  {editScore}
                </span>
                <p className="text-xs text-text-muted mt-1">{scoreLabel(editScore, editPar)}</p>
              </div>
              <button
                onClick={() => setEditScore(Math.min(15, editScore + 1))}
                className="w-14 h-14 rounded-xl bg-bg-card border border-border text-text text-xl font-bold flex items-center justify-center hover:border-text-muted/40 active:scale-95 transition-all duration-150"
              >
                +
              </button>
            </div>
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={saveHoleEdit}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUMMARY
  if (view === 'summary' && round) {
    const birdies = round.holes.filter((h) => h.score > 0 && h.score < h.par).length;
    const pars = round.holes.filter((h) => h.score > 0 && h.score === h.par).length;
    const bogeys = round.holes.filter((h) => h.score > 0 && h.score > h.par).length;

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
              {diff > 0 ? `+${diff}` : diff === 0 ? 'Even' : diff} ({round.hole_count} holes)
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

          {/* Hole-by-hole color strip */}
          <div className="anim-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="flex gap-[2px]">
              {round.holes.map((h) => (
                <div
                  key={h.hole}
                  className="h-4 flex-1 rounded-[2px]"
                  style={{ background: h.score > 0 ? scoreColor(h.score, h.par) : '#243328', opacity: 0.7 }}
                />
              ))}
            </div>
          </div>

          {/* Full scorecard */}
          <div className="anim-fade-up" style={{ animationDelay: '180ms' }}>
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
                      <div className="px-3 py-1.5 text-center font-medium" style={{ color: scoreColor(h.score, h.par) }}>
                        {h.score}
                      </div>
                      <div
                        className="px-3 py-1.5 text-center font-medium"
                        style={{ color: scoreColor(h.score, h.par) }}
                      >
                        {d > 0 ? `+${d}` : d}
                      </div>
                    </div>
                  );
                })}
                <div className="contents">
                  <div className="px-3 py-2 text-text font-semibold border-t border-border">Total</div>
                  <div className="px-3 py-2 text-center font-semibold border-t border-border">{totalPar}</div>
                  <div className="px-3 py-2 text-center text-text font-semibold border-t border-border">{totalScore}</div>
                  <div
                    className="px-3 py-2 text-center font-semibold border-t border-border"
                    style={{ color: diff < 0 ? '#4ADE80' : diff === 0 ? '#FACC15' : '#F87171' }}
                  >
                    {diff > 0 ? `+${diff}` : diff === 0 ? 'E' : diff}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <button
              onClick={() => { setRound(null); setView('setup'); setCourseName(''); setCourseQuery(''); setSelectedCourse(null); setSelectedTee(null); }}
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
