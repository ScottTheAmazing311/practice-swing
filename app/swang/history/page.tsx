'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { SwangRound } from '@/lib/swang-types';
import { getSwangRounds } from '@/lib/swang-storage';

const GRADE_COLORS = ['#F87171', '#FB923C', '#FACC15', '#A3E635', '#4ADE80', '#22D3EE'];

export default function SwangHistory() {
  const [rounds, setRounds] = useState<SwangRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRounds(getSwangRounds());
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Past Rounds" onBack="/swang" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-bg-card border border-border rounded-2xl h-24" />
            ))}
          </div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-12 anim-fade-up">
            <p className="text-text-muted text-sm mb-4">No rounds yet.</p>
            <Link href="/swang/round" className="text-accent text-sm font-medium hover:underline">
              Start your first round
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rounds.map((r, i) => {
              const date = new Date(r.created_at);
              return (
                <div
                  key={r.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="anim-fade-up bg-bg-card border border-border rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-text font-semibold text-sm">{r.course}</p>
                      <p className="text-[11px] text-text-muted">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-2xl font-bold tabular-nums"
                        style={{ color: r.totalPoints >= 0 ? '#4ADE80' : '#F87171' }}
                      >
                        {r.totalPoints >= 0 ? '+' : ''}{r.totalPoints}
                      </p>
                      <p className="text-[11px] text-text-muted">{r.hole_count} holes</p>
                    </div>
                  </div>

                  {/* Per-hole shot grade bars */}
                  <div className="space-y-1">
                    {r.holes.map((h) => (
                      <div key={h.hole} className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted w-5 text-right tabular-nums shrink-0">{h.hole}</span>
                        <div className="flex gap-[2px] flex-1">
                          {h.shots.map((s, j) => (
                            <div
                              key={j}
                              className="h-3 flex-1 rounded-[2px]"
                              style={{ background: GRADE_COLORS[s.grade], opacity: 0.7 }}
                            />
                          ))}
                        </div>
                        <span
                          className="text-[10px] font-bold tabular-nums w-7 text-right"
                          style={{ color: h.holeTotal >= 0 ? '#4ADE80' : '#F87171' }}
                        >
                          {h.holeTotal >= 0 ? '+' : ''}{h.holeTotal}
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
