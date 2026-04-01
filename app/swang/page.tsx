'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getActiveSwangRound, getSwangRounds } from '@/lib/swang-storage';
import { getUsername, getCrewLeaderboard } from '@/lib/swang-leaderboard';

const HOW_IT_WORKS = [
  { title: 'Pick Your Club', desc: 'Select from Driver to Putter before each shot' },
  { title: 'Grade the Shot', desc: 'Rate each shot 0-5 to earn grade points' },
  { title: 'Putt to Finish', desc: 'Selecting Putter ends your shots for the hole' },
  { title: 'Score the Hole', desc: 'Birdie, Par, Bogey — each result adds or subtracts points' },
  { title: 'Bonus Points', desc: 'Clutch Shot? High Vibes? Tag highlights for extra points' },
  { title: 'Climb the Board', desc: 'Your total posts to the crew leaderboard' },
];

export default function SwangLanding() {
  const [hasActive, setHasActive] = useState(false);
  const [recentCount, setRecentCount] = useState(0);
  const [hasUsername, setHasUsername] = useState(false);
  const [leaderboardCount, setLeaderboardCount] = useState(0);
  const [showHowTo, setShowHowTo] = useState(true);

  useEffect(() => {
    const active = getActiveSwangRound();
    setHasActive(!!active && !active.completed);
    setRecentCount(getSwangRounds().length);
    setHasUsername(!!getUsername());
    setLeaderboardCount(getCrewLeaderboard().length);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Swang" onBack="/" />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-6 space-y-6">
        <div className="anim-fade-up text-center">
          <h2
            className="text-4xl text-text leading-[1.1] mb-2 font-bold"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Swang
          </h2>
          <p className="text-text-muted text-sm max-w-[260px] mx-auto leading-relaxed">
            Grade every shot, earn points
          </p>
        </div>

        {/* How it works — inline */}
        <div className="anim-fade-up" style={{ animationDelay: '40ms' }}>
          <button
            onClick={() => setShowHowTo(!showHowTo)}
            className="w-full flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3 transition-colors hover:border-accent/30"
          >
            <span className="text-text text-sm font-semibold">How does Swang work?</span>
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className={`text-text-muted transition-transform duration-200 ${showHowTo ? 'rotate-180' : ''}`}
            >
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showHowTo && (
            <div className="mt-3 space-y-4">
              <div className="bg-bg-card border border-border rounded-xl p-4">
                <p className="text-text text-sm leading-relaxed">
                  Swang turns every round into a points game. Instead of just tracking your score,
                  you grade each individual shot and earn points for how well you play — not just the final number on the hole.
                </p>
              </div>

              <div className="space-y-0.5">
                {HOW_IT_WORKS.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-b-0"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5"
                      style={{
                        background: 'rgba(74, 222, 128, 0.15)',
                        color: '#4ADE80',
                        border: '1px solid rgba(74, 222, 128, 0.25)',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-text text-sm font-semibold leading-tight">{step.title}</p>
                      <p className="text-text-muted text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-bg-card border border-accent/20 rounded-xl p-4 space-y-2">
                <p className="text-accent text-[11px] font-bold uppercase tracking-wider">Points</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Shot Grades</span>
                    <span className="text-text font-semibold">0-5 each</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Eagle+</span>
                    <span className="font-semibold" style={{ color: '#4ADE80' }}>+10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Birdie</span>
                    <span className="font-semibold" style={{ color: '#4ADE80' }}>+5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Par</span>
                    <span className="font-semibold" style={{ color: '#4ADE80' }}>+3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Bogey</span>
                    <span className="font-semibold" style={{ color: '#F87171' }}>-3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Dbl Bogey+</span>
                    <span className="font-semibold" style={{ color: '#F87171' }}>-5</span>
                  </div>
                  <div className="flex justify-between col-span-2 pt-1 border-t border-border/50">
                    <span className="text-text-muted">Bonuses</span>
                    <span className="text-accent font-semibold">up to +5</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 anim-fade-up" style={{ animationDelay: '80ms' }}>
          <Link
            href="/swang/round"
            className="group relative overflow-hidden rounded-2xl min-h-[72px]
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/15
              active:scale-[0.97]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-emerald-400 to-accent bg-[length:200%_100%] group-hover:animate-[shimmer_2s_ease-in-out_infinite]" />
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
            />
            <div className="absolute inset-px rounded-[15px] bg-gradient-to-b from-white/20 to-transparent" />
            <div className="relative flex flex-col items-center justify-center px-4 py-5">
              <span className="text-bg font-bold text-base tracking-tight">
                {hasActive ? 'Resume Round' : 'Start Round'}
              </span>
              <span className="text-bg/60 text-[10px] font-medium">Shot-by-shot scoring</span>
            </div>
          </Link>

          <div className="flex gap-3">
            <Link
              href="/swang/leaderboard"
              className="group relative flex-1 overflow-hidden rounded-2xl min-h-[72px]
                border border-border
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
                active:scale-[0.97]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-bg-card to-bg-card
                group-hover:from-accent/5 group-hover:to-transparent transition-all duration-500" />
              <div className="relative flex flex-col items-center justify-center px-4 py-5">
                <span className="text-text font-bold text-sm tracking-tight group-hover:text-accent transition-colors duration-300">
                  Leaderboard
                </span>
                <span className="text-text-muted text-[10px] font-medium">
                  {hasUsername
                    ? leaderboardCount > 0
                      ? `${leaderboardCount} score${leaderboardCount !== 1 ? 's' : ''}`
                      : 'No scores yet'
                    : 'Set your tag'}
                </span>
              </div>
            </Link>

            <Link
              href="/swang/history"
              className="group relative flex-1 overflow-hidden rounded-2xl min-h-[72px]
                border border-border
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
                active:scale-[0.97]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-bg-card to-bg-card
                group-hover:from-accent/5 group-hover:to-transparent transition-all duration-500" />
              <div className="relative flex flex-col items-center justify-center px-4 py-5">
                <span className="text-text font-bold text-sm tracking-tight group-hover:text-accent transition-colors duration-300">
                  Past Rounds
                </span>
                <span className="text-text-muted text-[10px] font-medium">
                  {recentCount > 0 ? `${recentCount} round${recentCount !== 1 ? 's' : ''}` : 'No rounds yet'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
