'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PlayerManager from '@/components/PlayerManager';
import { Player, SkinsGame } from '@/lib/games-types';
import {
  getPlayers,
  savePlayers,
  getActiveSkinsGame,
  setActiveSkinsGame,
  saveSkinsGame,
  addWagerEntry,
} from '@/lib/games-storage';

type View = 'setup' | 'playing' | 'enter_scores' | 'summary';

export default function SkinsPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [game, setGame] = useState<SkinsGame | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [holeScores, setHoleScores] = useState<number[]>([]);

  useEffect(() => {
    const savedPlayers = getPlayers();
    if (savedPlayers.length > 0) setPlayers(savedPlayers);

    const active = getActiveSkinsGame();
    if (active && !active.completed) {
      setGame(active);
      setPlayers(active.players);
      setHoleCount(active.hole_count);
      setCurrentHole(active.currentHole);
      setView('playing');
    }
  }, []);

  const persist = useCallback((g: SkinsGame) => {
    setGame(g);
    setActiveSkinsGame(g);
  }, []);

  const handlePlayersChange = (p: Player[]) => {
    setPlayers(p);
    savePlayers(p);
  };

  const startGame = () => {
    const g: SkinsGame = {
      id: `skins-${Date.now()}`,
      created_at: new Date().toISOString(),
      players,
      holes: [],
      skinsWon: players.map(() => 0),
      currentHole: 1,
      hole_count: holeCount,
      carryOver: 0,
      completed: false,
    };
    persist(g);
    setCurrentHole(1);
    setView('playing');
  };

  const beginHole = () => {
    setHoleScores(players.map(() => 4));
    setView('enter_scores');
  };

  const updateScore = (idx: number, delta: number) => {
    setHoleScores((prev) => {
      const next = [...prev];
      next[idx] = Math.max(1, Math.min(15, next[idx] + delta));
      return next;
    });
  };

  const submitHole = () => {
    if (!game) return;

    const minScore = Math.min(...holeScores);
    const winners = holeScores.map((s, i) => s === minScore ? i : -1).filter((i) => i >= 0);
    const isTie = winners.length > 1;

    const skinsWorth = game.carryOver + 1;
    const newSkinsWon = [...game.skinsWon];
    let newCarry = game.carryOver;

    const winnerIndex = isTie ? null : winners[0];

    if (!isTie && winnerIndex !== null) {
      newSkinsWon[winnerIndex] += skinsWorth;
      newCarry = 0;
    } else {
      newCarry = game.carryOver + 1;
    }

    const nextHole = currentHole + 1;
    const isFinished = currentHole >= game.hole_count;

    const updated: SkinsGame = {
      ...game,
      holes: [...game.holes, {
        hole: currentHole,
        scores: holeScores,
        winnerIndex,
        skinsWorth,
      }],
      skinsWon: newSkinsWon,
      currentHole: isFinished ? currentHole : nextHole,
      carryOver: newCarry,
      completed: isFinished,
    };

    persist(updated);

    if (isFinished) {
      saveSkinsGame(updated);
      setActiveSkinsGame(null);
      addWagerEntry({
        id: `w-${Date.now()}`,
        created_at: new Date().toISOString(),
        gameType: 'skins',
        players: players.map((p) => p.name),
        results: newSkinsWon,
      });
      setView('summary');
    } else {
      setCurrentHole(nextHole);
      setView('playing');
    }
  };

  // SETUP
  if (view === 'setup') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Skins" onBack="/games" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up">
            <PlayerManager players={players} onChange={handlePlayersChange} min={2} max={6} />
          </div>

          <div className="anim-fade-up space-y-3" style={{ animationDelay: '60ms' }}>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Holes</p>
            <div className="flex gap-3">
              {([9, 18] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setHoleCount(n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]
                    ${holeCount === n
                      ? 'bg-accent text-bg'
                      : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                    }`}
                >
                  {n} Holes
                </button>
              ))}
            </div>
          </div>
        </main>

        {players.length >= 2 && (
          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
            <div className="max-w-lg mx-auto">
              <button
                onClick={startGame}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
              >
                Start Skins
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PLAYING - hole overview
  if (view === 'playing' && game) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={`Skins - Hole ${currentHole}`} onBack="/games" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
              Hole {currentHole} of {game.hole_count}
            </p>
            {game.carryOver > 0 && (
              <p className="text-accent-warm text-sm font-semibold mt-1">
                {game.carryOver + 1} skins on the line
              </p>
            )}
          </div>

          {/* Skins scoreboard */}
          <div className="anim-fade-up space-y-2" style={{ animationDelay: '60ms' }}>
            {game.players.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3"
              >
                <span className="text-sm text-text font-medium">{p.name}</span>
                <span className="text-lg font-bold tabular-nums text-accent">
                  {game.skinsWon[i]}
                </span>
              </div>
            ))}
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={beginHole}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Play Hole {currentHole}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ENTER SCORES
  if (view === 'enter_scores' && game) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={`Hole ${currentHole} - Scores`} onBack={() => setView('playing')} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs">Enter each player&apos;s score</p>
            {game.carryOver > 0 && (
              <p className="text-accent-warm text-xs mt-1">Worth {game.carryOver + 1} skins</p>
            )}
          </div>

          <div className="anim-fade-up space-y-4" style={{ animationDelay: '60ms' }}>
            {game.players.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm text-text font-medium w-24 truncate">{p.name}</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateScore(i, -1)}
                    className="w-10 h-10 rounded-lg bg-bg-card border border-border text-text flex items-center justify-center hover:border-text-muted/40 active:scale-95 transition-all duration-150"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold tabular-nums text-text w-8 text-center">
                    {holeScores[i]}
                  </span>
                  <button
                    onClick={() => updateScore(i, 1)}
                    className="w-10 h-10 rounded-lg bg-bg-card border border-border text-text flex items-center justify-center hover:border-text-muted/40 active:scale-95 transition-all duration-150"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={submitHole}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              {currentHole >= game.hole_count ? 'Finish Game' : 'Submit Hole'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUMMARY
  if (view === 'summary' && game) {
    const sorted = game.players
      .map((p, i) => ({ name: p.name, skins: game.skinsWon[i] }))
      .sort((a, b) => b.skins - a.skins);

    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Skins - Final" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Winner</p>
            <p className="text-3xl font-bold text-accent">{sorted[0].name}</p>
            <p className="text-text-muted text-sm mt-1">{sorted[0].skins} skins</p>
          </div>

          <div className="anim-fade-up space-y-2" style={{ animationDelay: '60ms' }}>
            {sorted.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                  i === 0 ? 'bg-accent/10 border-accent/30' : 'bg-bg-card border-border'
                }`}
              >
                <span className="text-sm text-text font-medium">{i + 1}. {p.name}</span>
                <span className="text-lg font-bold tabular-nums text-accent">
                  {p.skins}
                </span>
              </div>
            ))}
          </div>

          {game.carryOver > 0 && (
            <div className="anim-fade-up text-center" style={{ animationDelay: '120ms' }}>
              <p className="text-xs text-text-muted">{game.carryOver} unclaimed skins carried over</p>
            </div>
          )}
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <button
              onClick={() => { setGame(null); setView('setup'); }}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              New Game
            </button>
            <button
              onClick={() => router.push('/games')}
              className="w-full py-4 rounded-2xl font-semibold text-base border border-border text-text-muted transition-all duration-200 hover:border-text-muted/40 active:scale-[0.98] min-h-[56px]"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
