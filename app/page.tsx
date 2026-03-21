'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
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
          <h1 className="text-5xl sm:text-6xl text-text leading-[1.1] mb-4 font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Practice
            <br />
            Swing
          </h1>
          <p className="text-text-muted text-sm max-w-[260px] mx-auto leading-relaxed">
            Grind. Track. Repeat.
          </p>
        </div>

        <div className="w-full flex flex-row gap-3 anim-fade-up" style={{ animationDelay: '120ms' }}>
          <button
            onClick={() => { new Audio('/log.mp3').play().catch(() => {}); router.push('/session'); }}
            className="group relative flex-1 overflow-hidden rounded-2xl min-h-[72px]
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/15
              active:scale-[0.97] text-left"
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
            <div className="relative flex flex-col items-center justify-center px-4 py-5">
              <span className="text-bg font-bold text-base tracking-tight">Log Session</span>
              <span className="text-bg/60 text-[10px] font-medium">Hit the range</span>
            </div>
          </button>

          <Link
            href="/history"
            className="group relative flex-1 overflow-hidden rounded-2xl min-h-[72px]
              border border-border
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
              active:scale-[0.97]"
          >
            {/* Subtle gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-bg-card to-bg-card
              group-hover:from-accent/5 group-hover:to-transparent transition-all duration-500" />
            {/* Content */}
            <div className="relative flex flex-col items-center justify-center px-4 py-5">
              <span className="text-text font-bold text-base tracking-tight group-hover:text-accent transition-colors duration-300">
                View Progress
              </span>
              <span className="text-text-muted text-[10px] font-medium">See your grind</span>
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
