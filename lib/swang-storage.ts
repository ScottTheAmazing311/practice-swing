import { SwangRound } from './swang-types';

const ROUNDS_KEY = 'swang-swang-rounds';
const ACTIVE_KEY = 'swang-swang-active';

function getRounds(): SwangRound[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ROUNDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setRounds(rounds: SwangRound[]) {
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds));
}

export function getSwangRounds(): SwangRound[] {
  return getRounds().filter((r) => r.completed);
}

export function saveSwangRound(round: SwangRound) {
  const rounds = getRounds();
  const idx = rounds.findIndex((r) => r.id === round.id);
  if (idx >= 0) {
    rounds[idx] = round;
  } else {
    rounds.unshift(round);
  }
  setRounds(rounds);
}

export function getActiveSwangRound(): SwangRound | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveSwangRound(round: SwangRound | null) {
  if (round) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(round));
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function deleteSwangRound(id: string) {
  setRounds(getRounds().filter((r) => r.id !== id));
}
