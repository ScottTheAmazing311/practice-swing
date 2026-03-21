'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        {/* Hero image */}
        <div className="anim-fade-up w-full max-w-[320px] aspect-[4/3] rounded-2xl overflow-hidden mb-8 border border-border/50">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: 'url(/home.png)' }}
          />
        </div>

        <div className="anim-fade-up text-center mb-16" style={{ animationDelay: '60ms' }}>
          <p className="text-text-muted text-xs font-medium uppercase tracking-[0.2em] mb-4">
            Golf Practice Logger
          </p>
          <h1 className="text-5xl sm:text-6xl text-text leading-[1.1] mb-4 font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Practice
            <br />
            Swing
          </h1>
          <p className="text-text-muted text-sm max-w-[260px] mx-auto leading-relaxed">
            Grind. Track. Repeat.
          </p>
        </div>

        <div className="w-full flex flex-col gap-4 anim-fade-up" style={{ animationDelay: '120ms' }}>
          <Link
            href="/session"
            onClick={() => new Audio('/log.mp3').play().catch(() => {})}
            className="group relative w-full overflow-hidden rounded-2xl min-h-[72px]
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/15
              active:scale-[0.97]"
          >
            {/* Gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-emerald-400 to-accent bg-[length:200%_100%] group-hover:animate-[shimmer_2s_ease-in-out_infinite]" />
            {/* Noise overlay */}
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
            />
            {/* Inner highlight */}
            <div className="absolute inset-px rounded-[15px] bg-gradient-to-b from-white/20 to-transparent" />
            {/* Content */}
            <div className="relative flex items-center justify-between px-6 py-5">
              <div className="flex flex-col">
                <span className="text-bg font-bold text-lg tracking-tight">Log Session</span>
                <span className="text-bg/60 text-[11px] font-medium">Hit the range</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-bg/20 flex items-center justify-center
                transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110">
                <svg className="w-5 h-5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/history"
            className="group relative w-full overflow-hidden rounded-2xl min-h-[72px]
              border border-border
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
              active:scale-[0.97]"
          >
            {/* Subtle gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-bg-card to-bg-card
              group-hover:from-accent/5 group-hover:to-transparent transition-all duration-500" />
            {/* Left accent bar */}
            <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-accent/30
              group-hover:bg-accent group-hover:shadow-[0_0_8px_rgba(74,222,128,0.3)]
              transition-all duration-300" />
            {/* Content */}
            <div className="relative flex items-center justify-between px-6 py-5">
              <div className="flex flex-col">
                <span className="text-text font-bold text-lg tracking-tight group-hover:text-accent transition-colors duration-300">
                  View Progress
                </span>
                <span className="text-text-muted text-[11px] font-medium">See your grind</span>
              </div>
              <div className="w-10 h-10 rounded-xl border border-border flex items-center justify-center
                group-hover:border-accent/30 group-hover:bg-accent/10
                transition-all duration-300 group-hover:translate-x-1">
                <svg className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-text-muted/40 text-[10px] uppercase tracking-[0.15em]">
          Built for the range
        </p>
      </footer>
    </div>
  );
}
