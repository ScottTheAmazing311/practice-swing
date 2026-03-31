'use client';

import Link from 'next/link';

export default function Header({
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
