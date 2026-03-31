'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getActiveSwingRound, getSwingRounds } from '@/lib/swing-storage';

export default function SwingLanding() {
  const [hasActive, setHasActive] = useState(false);
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    const active = getActiveSwingRound();
    setHasActive(!!active && !active.completed);
    setRecentCount(getSwingRounds().length);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Swing" onBack="/" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        <div className="anim-fade-up text-center mb-12">
          <h2
            className="text-4xl text-text leading-[1.1] mb-3 font-bold"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Swing
          </h2>
          <p className="text-text-muted text-sm max-w-[260px] mx-auto leading-relaxed">
            Traditional scorecard
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 anim-fade-up" style={{ animationDelay: '80ms' }}>
          <Link
            href="/swing/round"
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
              <span className="text-bg/60 text-[10px] font-medium">Hole-by-hole scorecard</span>
            </div>
          </Link>

          <Link
            href="/swing/history"
            className="group relative overflow-hidden rounded-2xl min-h-[72px]
              border border-border
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
              active:scale-[0.97]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-bg-card to-bg-card
              group-hover:from-accent/5 group-hover:to-transparent transition-all duration-500" />
            <div className="relative flex flex-col items-center justify-center px-4 py-5">
              <span className="text-text font-bold text-base tracking-tight group-hover:text-accent transition-colors duration-300">
                Past Rounds
              </span>
              <span className="text-text-muted text-[10px] font-medium">
                {recentCount > 0 ? `${recentCount} round${recentCount !== 1 ? 's' : ''}` : 'No rounds yet'}
              </span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
