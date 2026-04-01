'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';

const GAMES = [
  {
    name: 'Wolf',
    desc: '4 players, pick your partner',
    href: '/games/wolf',
  },
  {
    name: 'Skins',
    desc: 'Lowest score wins the skin',
    href: '/games/skins',
  },
];

export default function GamesLanding() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Swang Games" onBack="/" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        <div className="anim-fade-up w-full mb-8">
          <Image
            src="/games.png"
            alt="Swang Games - Wolf, Skins & More"
            width={640}
            height={360}
            className="w-full h-auto rounded-xl"
            priority
          />
        </div>

        <div className="w-full flex flex-col gap-3 anim-fade-up" style={{ animationDelay: '80ms' }}>
          {GAMES.map((game, i) => (
            <Link
              key={game.name}
              href={game.href}
              style={{ animationDelay: `${80 + i * 50}ms` }}
              className="anim-fade-up group relative overflow-hidden rounded-2xl min-h-[72px]
                border border-border
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
                active:scale-[0.97]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-bg-card to-bg-card
                group-hover:from-accent/5 group-hover:to-transparent transition-all duration-500" />
              <div className="relative flex flex-col items-center justify-center px-4 py-5">
                <span className="text-text font-bold text-base tracking-tight group-hover:text-accent transition-colors duration-300">
                  {game.name}
                </span>
                <span className="text-text-muted text-[10px] font-medium mt-0.5">{game.desc}</span>
              </div>
            </Link>
          ))}

          <Link
            href="/games/history"
            className="group relative overflow-hidden rounded-2xl min-h-[56px]
              border border-border/50
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:border-accent/20
              active:scale-[0.97]"
          >
            <div className="relative flex items-center justify-center px-4 py-4">
              <span className="text-text-muted text-sm font-medium group-hover:text-accent transition-colors duration-300">
                Wager Ledger
              </span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
