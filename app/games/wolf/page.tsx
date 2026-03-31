'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PlayerManager from '@/components/PlayerManager';
import { Player, WolfHole, WolfGame } from '@/lib/games-types';
import {
  getPlayers,
  savePlayers,
  getActiveWolfGame,
  setActiveWolfGame,
  saveWolfGame,
  addWagerEntry,
} from '@/lib/games-storage';

type View = 'setup' | 'playing' | 'pick_partner' | 'enter_scores' | 'hole_result' | 'summary';

export default function WolfPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<WolfGame | null>(null);
  const [currentHole, setCurrentHole] = useState(1);

  // Hole state
  const [wolfIndex, setWolfIndex] = useState(0);
  const [partnerIndex, setPartnerIndex] = useState<number | null>(null);
  const [goesAlone, setGoesAlone] = useState(false);
  const [holeScores, setHoleScores] = useState<number[]>([]);

  useEffect(() => {
    const savedPlayers = getPlayers();
    if (savedPlayers.length > 0) setPlayers(savedPlayers);

    const active = getActiveWolfGame();
    if (active && !active.completed) {
      setGame(active);
      setPlayers(active.players);
      setCurrentHole(active.currentHole);
      setWolfIndex((active.currentHole - 1) % 4);
      setView('playing');
    }
  }, []);

  const persist = useCallback((g: WolfGame) => {
    setGame(g);
    setActiveWolfGame(g);
  }, []);

  const handlePlayersChange = (p: Player[]) => {
    setPlayers(p);
    savePlayers(p);
  };

  const startGame = () => {
    const g: WolfGame = {
      id: `wolf-${Date.now()}`,
      created_at: new Date().toISOString(),
      players,
      holes: [],
      scores: [0, 0, 0, 0],
      currentHole: 1,
      completed: false,
    };
    persist(g);
    setCurrentHole(1);
    setWolfIndex(0);
    setView('playing');
  };

  const startHole = () => {
    setPartnerIndex(null);
    setGoesAlone(false);
    setHoleScores(players.map(() => 4));
    setView('pick_partner');
  };

  const confirmPartner = () => {
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

    const partner = goesAlone ? null : partnerIndex;

    // Determine wolf team and other team
    const wolfTeam = partner !== null ? [wolfIndex, partner] : [wolfIndex];
    const otherTeam = players.map((_, i) => i).filter((i) => !wolfTeam.includes(i));

    const wolfBest = Math.min(...wolfTeam.map((i) => holeScores[i]));
    const otherBest = Math.min(...otherTeam.map((i) => holeScores[i]));

    const wolfWins = wolfBest < otherBest;
    const tie = wolfBest === otherBest;

    // Points: alone = 4pts, with partner = 2pts each. Losing side pays.
    const pointValue = goesAlone ? 4 : 2;
    const newScores = [...game.scores];

    if (!tie) {
      const winners = wolfWins ? wolfTeam : otherTeam;
      const losers = wolfWins ? otherTeam : wolfTeam;
      winners.forEach((i) => { newScores[i] += pointValue; });
      losers.forEach((i) => { newScores[i] -= pointValue; });
    }

    const hole: WolfHole = {
      hole: currentHole,
      wolfIndex,
      partnerIndex: partner,
      scores: holeScores,
      wolfTeamWon: wolfWins,
      points: pointValue,
    };

    const nextHole = currentHole + 1;
    const isFinished = currentHole >= 18;

    const updated: WolfGame = {
      ...game,
      holes: [...game.holes, hole],
      scores: newScores,
      currentHole: isFinished ? currentHole : nextHole,
      completed: isFinished,
    };

    persist(updated);

    if (isFinished) {
      saveWolfGame(updated);
      setActiveWolfGame(null);
      addWagerEntry({
        id: `w-${Date.now()}`,
        created_at: new Date().toISOString(),
        gameType: 'wolf',
        players: players.map((p) => p.name),
        results: newScores,
      });
      setView('summary');
    } else {
      setCurrentHole(nextHole);
      setWolfIndex((nextHole - 1) % 4);
      setView('playing');
    }
  };

  // SETUP
  if (view === 'setup') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Wolf" onBack="/games" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up">
            <PlayerManager players={players} onChange={handlePlayersChange} min={4} max={4} />
          </div>
        </main>

        {players.length === 4 && (
          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
            <div className="max-w-lg mx-auto">
              <button
                onClick={startGame}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
              >
                Start Wolf
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
        <Header title={`Wolf - Hole ${currentHole}`} onBack="/games" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Hole {currentHole} of 18</p>
            <p className="text-text text-lg font-semibold">
              {game.players[wolfIndex].name} is the Wolf
            </p>
          </div>

          {/* Scoreboard */}
          <div className="anim-fade-up space-y-2" style={{ animationDelay: '60ms' }}>
            {game.players.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                  i === wolfIndex ? 'bg-accent/10 border-accent/30' : 'bg-bg-card border-border'
                }`}
              >
                <span className="text-sm text-text font-medium">
                  {p.name} {i === wolfIndex ? '(Wolf)' : ''}
                </span>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: game.scores[i] > 0 ? '#4ADE80' : game.scores[i] < 0 ? '#F87171' : '#8CA394' }}
                >
                  {game.scores[i] > 0 ? '+' : ''}{game.scores[i]}
                </span>
              </div>
            ))}
          </div>
        </main>

        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
          <div className="max-w-lg mx-auto">
            <button
              onClick={startHole}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
            >
              Play Hole {currentHole}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PICK PARTNER
  if (view === 'pick_partner' && game) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={`Hole ${currentHole} - Pick Partner`} onBack={() => setView('playing')} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text text-lg font-semibold">{game.players[wolfIndex].name} picks</p>
            <p className="text-text-muted text-xs mt-1">Choose a partner or go alone</p>
          </div>

          <div className="anim-fade-up space-y-3" style={{ animationDelay: '60ms' }}>
            {game.players.map((p, i) => {
              if (i === wolfIndex) return null;
              const selected = partnerIndex === i && !goesAlone;
              return (
                <button
                  key={p.id}
                  onClick={() => { setPartnerIndex(i); setGoesAlone(false); }}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[48px]
                    active:scale-[0.98]
                    ${selected
                      ? 'bg-accent text-bg'
                      : 'bg-bg-card border border-border text-text hover:border-text-muted/40'
                    }`}
                >
                  {p.name}
                </button>
              );
            })}

            <button
              onClick={() => { setGoesAlone(true); setPartnerIndex(null); }}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[48px]
                active:scale-[0.98]
                ${goesAlone
                  ? 'bg-accent-warm text-bg'
                  : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                }`}
            >
              Go Alone (2x points)
            </button>
          </div>
        </main>

        {(partnerIndex !== null || goesAlone) && (
          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
            <div className="max-w-lg mx-auto">
              <button
                onClick={confirmPartner}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
              >
                Enter Scores
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ENTER SCORES
  if (view === 'enter_scores' && game) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={`Hole ${currentHole} - Scores`} onBack={() => setView('pick_partner')} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs">Enter each player&apos;s score</p>
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
              {currentHole >= 18 ? 'Finish Game' : 'Submit Hole'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUMMARY
  if (view === 'summary' && game) {
    const sorted = game.players
      .map((p, i) => ({ name: p.name, score: game.scores[i] }))
      .sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Wolf - Final" />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          <div className="anim-fade-up text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Winner</p>
            <p className="text-3xl font-bold text-accent">{sorted[0].name}</p>
            <p className="text-text-muted text-sm mt-1">{sorted[0].score > 0 ? '+' : ''}{sorted[0].score} points</p>
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
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: p.score > 0 ? '#4ADE80' : p.score < 0 ? '#F87171' : '#8CA394' }}
                >
                  {p.score > 0 ? '+' : ''}{p.score}
                </span>
              </div>
            ))}
          </div>
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
