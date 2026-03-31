'use client';

import Image from 'next/image';
import Link from 'next/link';

const SECTIONS = [
  {
    name: 'Swing',
    desc: 'Scorecard',
    href: '/swing',
    image: '/clubs/iron.png',
  },
  {
    name: 'Swang',
    desc: 'Shot Scoring',
    href: '/swang',
    image: '/clubs/driver.png',
  },
  {
    name: 'Practice Swing',
    desc: 'Range Sessions',
    href: '/practice',
    image: '/home.png',
  },
  {
    name: 'Swang Games',
    desc: 'Wolf, Skins & More',
    href: '/games',
    image: '/clubs/putter.png',
  },
];

export default function HubHome() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        <div className="anim-fade-up text-center mb-10">
          <Image
            src="/swanglogo.png"
            alt="Swang - Golf More Good"
            width={320}
            height={180}
            className="mx-auto rounded-xl"
            priority
          />
        </div>

        <div className="w-full grid grid-cols-2 gap-3">
          {SECTIONS.map((section, i) => (
            <Link
              key={section.name}
              href={section.href}
              style={{ animationDelay: `${60 + i * 50}ms` }}
              className="anim-fade-up group relative overflow-hidden rounded-2xl min-h-[160px]
                border-2 border-border
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10
                active:scale-[0.97]"
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-55 transition-opacity duration-300"
                style={{ backgroundImage: `url(${section.image})` }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              {/* Inset glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: 'inset 0 0 30px rgba(74, 222, 128, 0.06)' }}
              />
              {/* Content */}
              <div className="relative z-10 flex flex-col justify-end h-full p-4">
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
