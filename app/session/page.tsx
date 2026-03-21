'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { CLUBS, CLUB_IMAGE } from '@/lib/clubs';
import { ClubRating, ClubFeedback as ClubFeedbackType } from '@/lib/types';
import { saveDemoSession } from '@/lib/demo-data';
import { IS_DEMO, getSupabase } from '@/lib/supabase';
import RatingBar from '@/components/RatingBar';
import ClubFeedbackPanel from '@/components/ClubFeedback';
import ShareCard, { generateShareText } from '@/components/ShareCard';
import Toast from '@/components/Toast';
import { VIBE_OPTIONS } from '@/components/VibeIcons';

const BUCKET_OPTIONS = [
  { label: 'Small Bucket', balls: 30 },
  { label: 'Medium Bucket', balls: 50 },
  { label: 'Large Bucket', balls: 80 },
  { label: 'Several Large', balls: 100 },
];

type View = 'clubs' | 'rating' | 'wrapup' | 'summary';

export default function SessionPage() {
  const [view, setView] = useState<View>('clubs');
  const [ratings, setRatings] = useState<ClubRating[]>([]);
  const [activeClub, setActiveClub] = useState<string | null>(null);
  const [activeRating, setActiveRating] = useState(5);
  const [clubFeedback, setClubFeedback] = useState<Record<string, ClubFeedbackType>>({});
  const [ballsHit, setBallsHit] = useState(0);
  const [vibeEmoji, setVibeEmoji] = useState('');
  const [notes, setNotes] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = useCallback((msg: string) => setToast({ message: msg, visible: true }), []);
  const hideToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  const activeFeedback = activeClub ? (clubFeedback[activeClub] ?? {}) : {};

  const updateFeedback = (updated: ClubFeedbackType) => {
    if (!activeClub) return;
    setClubFeedback((prev) => ({ ...prev, [activeClub]: updated }));
  };

  // Tap a club card
  const selectClub = (club: string) => {
    setActiveClub(club);
    const existing = ratings.find((r) => r.club === club);
    setActiveRating(existing?.rating ?? 5);
    setView('rating');
  };

  // Done rating this club
  const finishClub = () => {
    if (!activeClub) return;
    setRatings((prev) => {
      const without = prev.filter((r) => r.club !== activeClub);
      return [...without, { club: activeClub, rating: activeRating }];
    });
    setActiveClub(null);
    setView('clubs');
  };

  // Finish session -> wrapup
  const goToWrapup = () => {
    setView('wrapup');
  };

  // Save
  const save = async (share: boolean) => {
    setSaving(true);

    if (IS_DEMO) {
      await new Promise((r) => setTimeout(r, 400));
      saveDemoSession(ratings, clubFeedback, ballsHit, notes, share);
    } else {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            let videoUrl: string | null = null;
            if (videoFile) {
              const ext = videoFile.name.split('.').pop();
              const path = `${user.id}/${Date.now()}.${ext}`;
              const { data } = await supabase.storage
                .from('practice-videos')
                .upload(path, videoFile);
              if (data) {
                const { data: urlData } = supabase.storage
                  .from('practice-videos')
                  .getPublicUrl(data.path);
                videoUrl = urlData.publicUrl;
              }
            }

            const { data: session } = await supabase
              .from('practice_sessions')
              .insert({
                user_id: user.id,
                notes: notes.trim() || null,
                video_url: videoUrl,
                balls_hit: ballsHit || null,
                discord_shared: share,
              })
              .select()
              .single();

            if (session) {
              await supabase.from('session_clubs').insert(
                ratings.map((r) => ({ session_id: session.id, club: r.club, rating: r.rating }))
              );
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (share) {
      const text = generateShareText(ratings, clubFeedback, ballsHit, vibeEmoji);
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      } catch {
        showToast('Session saved');
      }
    } else {
      showToast('Session saved');
    }

    setSaving(false);
    setSaved(true);
  };

  // ──────────── VIEWS ────────────

  // CLUB GRID
  if (view === 'clubs') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          title={ratings.length > 0 ? `${ratings.length} club${ratings.length > 1 ? 's' : ''} rated` : 'Select a club'}
          onBack={ratings.length === 0 ? '/' : undefined}
        />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 flex flex-col">
          <div className="grid grid-cols-2 gap-3 flex-1">
            {CLUBS.map((club, i) => {
              const rated = ratings.find((r) => r.club === club);
              const img = CLUB_IMAGE[club];

              return (
                <button
                  key={club}
                  onClick={() => selectClub(club)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`
                    anim-fade-up relative overflow-hidden rounded-2xl
                    min-h-[140px] border-2 transition-all duration-200 ease-out
                    active:scale-[0.97] group
                    ${rated
                      ? 'border-accent/60 shadow-lg shadow-accent/10'
                      : 'border-border hover:border-text-muted/30'
                    }
                  `}
                >
                  {/* Background image */}
                  <div
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-200 ${
                      rated ? 'opacity-80' : 'opacity-50 group-hover:opacity-65'
                    }`}
                    style={{ backgroundImage: `url(${img})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col justify-end h-full p-3">
                    {rated && (
                      <span
                        className="text-3xl font-bold tabular-nums mb-1 self-start"
                        style={{
                          color: rated.rating <= 3 ? '#F87171' : rated.rating <= 6 ? '#FACC15' : '#4ADE80',
                        }}
                      >
                        {rated.rating}
                      </span>
                    )}
                    <span className={`text-sm font-semibold leading-tight ${
                      rated ? 'text-text' : 'text-text/90'
                    }`}>
                      {club}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        {/* Bottom CTA */}
        {ratings.length > 0 && (
          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
            <div className="max-w-lg mx-auto">
              <button
                onClick={goToWrapup}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
              >
                Finish Session
              </button>
            </div>
          </div>
        )}

        <Toast message={toast.message} visible={toast.visible} onDone={hideToast} />
      </div>
    );
  }

  // RATING VIEW (per-club)
  if (view === 'rating' && activeClub) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={activeClub} onBack={() => { finishClub(); }} />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-8">
          {/* Club image hero */}
          <div className="anim-fade-up relative w-full aspect-square max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-border">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url(${CLUB_IMAGE[activeClub]})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 to-transparent" />
          </div>

          {/* Rating */}
          <div className="anim-fade-up" style={{ animationDelay: '80ms' }}>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-4 text-center">
              How did it feel?
            </p>
            <RatingBar value={activeRating} onChange={setActiveRating} />
          </div>

          {/* Feedback controls */}
          <div className="anim-fade-up" style={{ animationDelay: '160ms' }}>
            <ClubFeedbackPanel
              feedback={activeFeedback}
              onChange={updateFeedback}
              isPutter={activeClub === 'Putter'}
            />
          </div>
        </main>

        {/* Done button */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={finishClub}
              className="flex-1 py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // WRAPUP VIEW (balls hit + vibe emoji)
  if (view === 'wrapup') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Wrap Up" onBack={() => setView('clubs')} />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-8">
          {/* Bucket selection */}
          <div className="anim-fade-up">
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-4">
              How many balls did you hit?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {BUCKET_OPTIONS.map((opt) => {
                const selected = ballsHit === opt.balls;
                return (
                  <button
                    key={opt.balls}
                    onClick={() => setBallsHit(selected ? 0 : opt.balls)}
                    className={`
                      py-4 rounded-2xl text-center transition-all duration-150
                      active:scale-[0.97] border-2
                      ${selected
                        ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
                        : 'border-border hover:border-text-muted/30'
                      }
                    `}
                  >
                    <span className={`text-2xl font-bold tabular-nums block ${selected ? 'text-accent' : 'text-text'}`}>
                      {opt.balls === 100 ? '100+' : opt.balls}
                    </span>
                    <span className={`text-[11px] font-medium mt-1 block ${selected ? 'text-accent/70' : 'text-text-muted'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vibe emoji */}
          <div className="anim-fade-up" style={{ animationDelay: '80ms' }}>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-4">
              Today I hit like:
            </p>
            <div className="grid grid-cols-4 gap-3">
              {VIBE_OPTIONS.map(({ emoji, image }) => {
                const selected = vibeEmoji === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => setVibeEmoji(selected ? '' : emoji)}
                    className={`
                      aspect-square rounded-2xl overflow-hidden
                      transition-all duration-150 active:scale-90 border-2
                      ${selected
                        ? 'border-accent scale-105 shadow-lg shadow-accent/10'
                        : 'border-border hover:border-text-muted/30'
                      }
                    `}
                  >
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Continue button */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => { new Audio('/finish.mp3').play().catch(() => {}); setView('summary'); }}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Continue
            </button>
          </div>
        </div>

        <Toast message={toast.message} visible={toast.visible} onDone={hideToast} />
      </div>
    );
  }

  // SUMMARY VIEW
  if (view === 'summary') {
    if (saved) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="anim-fade-up text-center max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-text mb-2">Nice session.</h1>
            <p className="text-text-muted text-sm mb-10">Keep putting in the work.</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/session"
                onClick={(e) => { e.preventDefault(); window.location.reload(); }}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg text-center transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
              >
                Log Another
              </Link>
              <Link
                href="/"
                className="w-full py-4 rounded-2xl font-semibold text-base border border-border text-text-muted text-center transition-all duration-200 hover:border-text-muted/40 active:scale-[0.98] min-h-[56px]"
              >
                Home
              </Link>
            </div>
          </div>
          <Toast message={toast.message} visible={toast.visible} onDone={hideToast} />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Session Summary" onBack={() => setView('wrapup')} />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          {/* Share card preview */}
          <div className="anim-fade-up">
            <ShareCard ratings={ratings} feedback={clubFeedback} ballsHit={ballsHit} vibeEmoji={vibeEmoji} />
          </div>

          {/* Notes */}
          <div className="anim-fade-up" style={{ animationDelay: '60ms' }}>
            <label className="block text-xs text-text-muted font-medium uppercase tracking-wider mb-2">
              Session Notes
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => e.target.value.length <= 280 && setNotes(e.target.value)}
                placeholder="Anything to remember?"
                rows={3}
                className="w-full bg-bg-card border border-border rounded-xl p-4 text-sm text-text placeholder:text-text-muted/40 resize-none focus:outline-none focus:border-accent/40 transition-colors duration-200"
              />
              <span className="absolute bottom-3 right-3 text-[10px] text-text-muted/40 tabular-nums">
                {notes.length}/280
              </span>
            </div>
          </div>

          {/* Video upload */}
          <div className="anim-fade-up" style={{ animationDelay: '120ms' }}>
            {!videoFile ? (
              <label className="block w-full min-h-[100px] rounded-xl border border-dashed border-border hover:border-text-muted/40 bg-bg-card/30 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 p-4">
                <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span className="text-xs text-text-muted">Attach a video</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size <= 50 * 1024 * 1024) setVideoFile(f);
                  }}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 bg-bg-card border border-border rounded-xl p-3">
                <svg className="w-5 h-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span className="text-xs text-text truncate flex-1">{videoFile.name}</span>
                <button
                  onClick={() => setVideoFile(null)}
                  className="text-text-muted hover:text-danger transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Actions */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 min-h-[56px]"
            >
              {saving ? 'Saving...' : 'Share Results'}
            </button>
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-semibold text-base border border-border text-text transition-all duration-200 hover:border-text-muted/40 hover:bg-bg-card active:scale-[0.98] disabled:opacity-50 min-h-[56px]"
            >
              {saving ? 'Saving...' : 'Save Without Sharing'}
            </button>
          </div>
        </div>

        <Toast message={toast.message} visible={toast.visible} onDone={hideToast} />
      </div>
    );
  }

  return null;
}

// ──── Shared header ────

function Header({
  title,
  onBack,
}: {
  title: string;
  onBack?: string | (() => void);
}) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-bg/80 border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
        {onBack && (
          typeof onBack === 'string' ? (
            <Link
              href={onBack}
              className="p-2 -ml-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-card transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
          ) : (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-card transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
          )
        )}
        <h1 className="font-display text-lg text-text">{title}</h1>
      </div>
    </header>
  );
}
