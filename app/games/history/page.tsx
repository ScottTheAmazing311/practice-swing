'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { WagerEntry } from '@/lib/games-types';
import { getWagerHistory } from '@/lib/games-storage';

export default function WagerLedger() {
  const [entries, setEntries] = useState<WagerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEntries(getWagerHistory());
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Wager Ledger" onBack="/games" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-bg-card border border-border rounded-2xl h-20" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 anim-fade-up">
            <p className="text-text-muted text-sm">No games played yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const date = new Date(entry.created_at);
              return (
                <div
                  key={entry.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="anim-fade-up bg-bg-card border border-border rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[11px] bg-bg-input border border-border rounded-md px-2 py-0.5 text-text-muted uppercase font-medium">
                        {entry.gameType}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {entry.players.map((name, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-xs text-text">{name}</span>
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{
                            color: entry.results[j] > 0 ? '#4ADE80' : entry.results[j] < 0 ? '#F87171' : '#8CA394',
                          }}
                        >
                          {entry.gameType === 'skins'
                            ? `${entry.results[j]} skins`
                            : `${entry.results[j] > 0 ? '+' : ''}${entry.results[j]}`
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
