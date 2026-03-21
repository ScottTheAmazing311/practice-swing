'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { SavedSession } from '@/lib/types';
import { IS_DEMO, getSupabase } from '@/lib/supabase';
import { getDemoSessions } from '@/lib/demo-data';
import { generateShareText } from '@/components/ShareCard';
import Toast from '@/components/Toast';

const RATING_COLORS = [
  '#EF4444', '#F87171', '#FB923C', '#FBBF24', '#FACC15',
  '#A3E635', '#4ADE80', '#34D399', '#2DD4BF', '#22D3EE',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false });

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const showToast = useCallback((msg: string) => setToast({ message: msg, visible: true }), []);
  const hideToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  useEffect(() => {
    async function load() {
      if (IS_DEMO) {
        setSessions(getDemoSessions());
      } else {
        const supabase = getSupabase();
        if (supabase) {
          const { data } = await supabase
            .from('practice_sessions')
            .select('*, session_clubs(*), session_disciplines(*)')
            .order('created_at', { ascending: false })
            .limit(200);
          if (data) setSessions(data as SavedSession[]);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  // Map dates to sessions
  const sessionsByDate = useMemo(() => {
    const map: Record<string, SavedSession[]> = {};
    sessions.forEach((s) => {
      const d = new Date(s.created_at);
      const key = dateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  const { firstDay, daysInMonth } = getMonthData(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDate(null);
  };

  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] ?? []) : [];

  const handleShare = async (s: SavedSession) => {
    const ratings = s.session_clubs.map((c) => ({ club: c.club, rating: c.rating }));
    const text = generateShareText(ratings, s.session_feedback ?? {}, s.notes ?? '');
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch {
      showToast('Copy failed');
    }
  };

  // Count sessions this month
  const monthSessionCount = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${viewYear}-${viewMonth}-${day}`;
      if (sessionsByDate[key]) count++;
    }
    return count;
  }, [sessionsByDate, viewYear, viewMonth, daysInMonth]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-bg/80 border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-card transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="font-display text-lg text-text">Progress</h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-bg-card border border-border rounded-2xl h-20" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Month navigation */}
            <div className="anim-fade-up flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-card transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="text-center">
                <h2 className="font-display text-xl text-text">
                  {MONTHS[viewMonth]} {viewYear}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {monthSessionCount} session{monthSessionCount !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-card transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Calendar grid */}
            <div className="anim-fade-up" style={{ animationDelay: '60ms' }}>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-[10px] text-text-muted/50 font-medium uppercase tracking-wider">
                    {wd}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const key = `${viewYear}-${viewMonth}-${day}`;
                  const hasSessions = !!sessionsByDate[key];
                  const isSelected = selectedDate === key;
                  const isToday = viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate();

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        if (hasSessions) setSelectedDate(isSelected ? null : key);
                      }}
                      className={`
                        aspect-square rounded-xl flex flex-col items-center justify-center
                        text-sm font-medium transition-all duration-150
                        ${isSelected
                          ? 'bg-accent text-bg scale-105'
                          : hasSessions
                            ? 'bg-accent/15 text-accent hover:bg-accent/25 active:scale-95'
                            : isToday
                              ? 'bg-bg-card border border-border text-text'
                              : 'text-text-muted/50'
                        }
                      `}
                    >
                      <span>{day}</span>
                      {hasSessions && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-accent mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day detail card */}
            {selectedDate && selectedSessions.length > 0 && (
              <div className="space-y-3 anim-fade-up">
                {selectedSessions.map((s) => {
                  const date = new Date(s.created_at);
                  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const fb = s.session_feedback ?? {};
                  const avgRating = s.session_clubs.length > 0
                    ? Math.round(s.session_clubs.reduce((sum, c) => sum + c.rating, 0) / s.session_clubs.length)
                    : 0;

                  return (
                    <div
                      key={s.id}
                      className="bg-bg-card border border-border rounded-2xl overflow-hidden"
                      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                    >
                      {/* Card header */}
                      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-text text-sm">
                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-[11px] text-text-muted mt-0.5">{timeStr}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] bg-bg-input border border-border rounded-md px-2 py-0.5 text-text-muted">
                            {s.session_clubs.length} club{s.session_clubs.length !== 1 ? 's' : ''}
                          </span>
                          {avgRating > 0 && (
                            <span
                              className="text-lg font-bold tabular-nums"
                              style={{ color: RATING_COLORS[Math.min(avgRating, 10) - 1] }}
                            >
                              {avgRating}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Club ratings */}
                      <div className="px-4 pb-3 space-y-1.5">
                        {s.session_clubs.map((c) => (
                          <div key={c.id} className="flex items-center gap-2">
                            <span className="text-[11px] text-text-muted w-16 text-right truncate shrink-0">{c.club}</span>
                            <div className="flex gap-[2px] flex-1">
                              {Array.from({ length: 10 }, (_, j) => (
                                <div
                                  key={j}
                                  className="h-4 flex-1 rounded-[2px]"
                                  style={{
                                    background: j < c.rating ? RATING_COLORS[c.rating - 1] : '#1A2B1E',
                                    opacity: j < c.rating ? 1 : 0.3,
                                  }}
                                />
                              ))}
                            </div>
                            <span
                              className="text-[11px] font-bold tabular-nums w-5 text-right"
                              style={{ color: RATING_COLORS[c.rating - 1] }}
                            >
                              {c.rating}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Feedback tags */}
                      {Object.keys(fb).length > 0 && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                          {Object.entries(fb).map(([club, cfb]) => (
                            <>
                              {cfb.accuracy !== undefined && (
                                <span key={`${club}-acc`} className={`text-[10px] font-medium rounded-md px-2 py-0.5 border ${
                                  cfb.accuracy >= 2 && cfb.accuracy <= 4
                                    ? 'bg-accent/10 text-accent border-accent/20'
                                    : 'bg-danger/10 text-danger border-danger/20'
                                }`}>
                                  {club}: {['Hook City',"Hookin'",'Good Fade','Straight','Good Draw',"Slicin'",'Slice Town'][cfb.accuracy]}
                                </span>
                              )}
                              {cfb.consistency !== undefined && (
                                <span key={`${club}-con`} className="text-[10px] font-medium bg-bg-input text-text-muted border border-border rounded-md px-2 py-0.5">
                                  {cfb.consistency}% good
                                </span>
                              )}
                              {cfb.putting !== undefined && (
                                <span key={`${club}-put`} className="text-[10px] font-medium bg-bg-input text-text-muted border border-border rounded-md px-2 py-0.5">
                                  Putting: {['Awful','Meh','OK','Solid','Tiger'][cfb.putting]}
                                </span>
                              )}
                            </>
                          ))}
                        </div>
                      )}

                      {/* Balls hit */}
                      {s.balls_hit && s.balls_hit > 0 && (
                        <div className="px-4 pb-3">
                          <p className="text-[11px] text-text-muted">{s.balls_hit >= 100 ? '100+' : s.balls_hit} balls hit</p>
                        </div>
                      )}

                      {/* Notes */}
                      {s.notes && (
                        <div className="px-4 pb-3">
                          <p className="text-xs text-text/70">{s.notes}</p>
                        </div>
                      )}

                      {/* Video */}
                      {s.video_url && (
                        <div className="px-4 pb-3">
                          <video src={s.video_url} controls className="w-full rounded-xl bg-bg-input" preload="metadata" />
                        </div>
                      )}

                      {/* Share */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => handleShare(s)}
                          className="w-full py-2.5 rounded-xl text-xs font-medium border border-border text-text-muted hover:border-text-muted/40 hover:text-text transition-all duration-200 min-h-[44px] active:scale-[0.98]"
                        >
                          Share Results
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {sessions.length === 0 && (
              <div className="text-center py-12 anim-fade-up">
                <p className="text-text-muted text-sm mb-4">No sessions yet.</p>
                <Link href="/session" className="text-accent text-sm font-medium hover:underline">
                  Log your first session
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <Toast message={toast.message} visible={toast.visible} onDone={hideToast} />
    </div>
  );
}
