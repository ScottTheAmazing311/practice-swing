'use client';

import { useState } from 'react';
import { Player } from '@/lib/games-types';

export default function PlayerManager({
  players,
  onChange,
  min = 2,
  max = 6,
}: {
  players: Player[];
  onChange: (players: Player[]) => void;
  min?: number;
  max?: number;
}) {
  const [name, setName] = useState('');

  const addPlayer = () => {
    const trimmed = name.trim();
    if (!trimmed || players.length >= max) return;
    onChange([...players, { id: `p-${Date.now()}`, name: trimmed }]);
    setName('');
  };

  const removePlayer = (id: string) => {
    onChange(players.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
          Players ({players.length}/{max})
        </p>
        {players.length < min && (
          <span className="text-[10px] text-accent-warm">Need at least {min}</span>
        )}
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3"
          >
            <span className="text-sm text-text font-medium">{p.name}</span>
            <button
              onClick={() => removePlayer(p.id)}
              className="text-text-muted hover:text-danger transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add player */}
      {players.length < max && (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Player name"
            className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-colors duration-200"
          />
          <button
            onClick={addPlayer}
            disabled={!name.trim()}
            className="px-5 py-3 rounded-xl text-sm font-semibold bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 min-h-[48px]"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
