import { SwingRound } from './swing-types';

const ROUNDS_KEY = 'swang-swing-rounds';
const ACTIVE_KEY = 'swang-swing-active';

function getRounds(): SwingRound[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ROUNDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setRounds(rounds: SwingRound[]) {
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds));
}

export function getSwingRounds(): SwingRound[] {
  return getRounds().filter((r) => r.completed);
}

export function saveSwingRound(round: SwingRound) {
  const rounds = getRounds();
  const idx = rounds.findIndex((r) => r.id === round.id);
  if (idx >= 0) {
    rounds[idx] = round;
  } else {
    rounds.unshift(round);
  }
  setRounds(rounds);
}

export function getActiveSwingRound(): SwingRound | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveSwingRound(round: SwingRound | null) {
  if (round) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(round));
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function deleteSwingRound(id: string) {
  setRounds(getRounds().filter((r) => r.id !== id));
}
