'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { SwingRound } from '@/lib/swing-types';
import { getSwingRounds } from '@/lib/swing-storage';

export default function SwingHistory() {
  const [rounds, setRounds] = useState<SwingRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRounds(getSwingRounds());
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Past Rounds" onBack="/swing" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-bg-card border border-border rounded-2xl h-20" />
            ))}
          </div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-12 anim-fade-up">
            <p className="text-text-muted text-sm mb-4">No rounds yet.</p>
            <Link href="/swing/round" className="text-accent text-sm font-medium hover:underline">
              Start your first round
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rounds.map((r, i) => {
              const total = r.holes.reduce((s, h) => s + h.score, 0);
              const par = r.holes.reduce((s, h) => s + h.par, 0);
              const diff = total - par;
              const date = new Date(r.created_at);

              return (
                <div
                  key={r.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="anim-fade-up bg-bg-card border border-border rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-text font-semibold text-sm">{r.course}</p>
                      <p className="text-[11px] text-text-muted">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-2xl font-bold tabular-nums"
                        style={{ color: diff < 0 ? '#4ADE80' : diff === 0 ? '#FACC15' : '#F87171' }}
                      >
                        {total}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {diff > 0 ? `+${diff}` : diff} | {r.hole_count} holes
                      </p>
                    </div>
                  </div>

                  {/* Mini bar chart */}
                  <div className="flex gap-[2px]">
                    {r.holes.map((h) => {
                      const d = h.score - h.par;
                      return (
                        <div
                          key={h.hole}
                          className="h-3 flex-1 rounded-[2px]"
                          style={{
                            background: d < 0 ? '#4ADE80' : d === 0 ? '#FACC15' : '#F87171',
                            opacity: 0.7,
                          }}
                        />
                      );
                    })}
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
