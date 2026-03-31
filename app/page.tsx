'use client';

import Link from 'next/link';

const SECTIONS = [
  {
    name: 'Swing',
    desc: 'Scorecard',
    href: '/swing',
  },
  {
    name: 'Swang',
    desc: 'Shot Scoring',
    href: '/swang',
  },
  {
    name: 'Practice Swing',
    desc: 'Range Sessions',
    href: '/practice',
  },
  {
    name: 'Swang Games',
    desc: 'Wolf, Skins & More',
    href: '/games',
  },
];

export default function HubHome() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        <div className="anim-fade-up text-center mb-12">
          <h1
            className="text-5xl sm:text-6xl text-text leading-[1.1] mb-3 font-bold"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Swang
          </h1>
          <p className="text-text-muted text-sm max-w-[260px] mx-auto leading-relaxed">
            Your golf companion
          </p>
        </div>

        <div className="w-full grid grid-cols-2 gap-3">
          {SECTIONS.map((section, i) => (
            <Link
              key={section.name}
              href={section.href}
              style={{ animationDelay: `${60 + i * 50}ms` }}
              className="anim-fade-up group relative overflow-hidden rounded-2xl min-h-[120px]
                border border-border
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
                active:scale-[0.97]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-bg-card to-bg-card
                group-hover:from-accent/5 group-hover:to-transparent transition-all duration-500" />
              <div className="relative flex flex-col justify-end h-full p-4">
                <span className="text-text font-bold text-base tracking-tight group-hover:text-accent transition-colors duration-300">
                  {section.name}
                </span>
                <span className="text-text-muted text-[11px] font-medium mt-0.5">
                  {section.desc}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-text-muted/40 text-[10px] uppercase tracking-[0.15em]">
          Built for the course
        </p>
      </footer>
    </div>
  );
}
