import { Player, WolfGame, SkinsGame, WagerEntry } from './games-types';

const PLAYERS_KEY = 'swang-players';
const WOLF_KEY = 'swang-wolf-games';
const WOLF_ACTIVE_KEY = 'swang-wolf-active';
const SKINS_KEY = 'swang-skins-games';
const SKINS_ACTIVE_KEY = 'swang-skins-active';
const WAGERS_KEY = 'swang-wager-history';

function getJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Players
export function getPlayers(): Player[] {
  return getJson<Player[]>(PLAYERS_KEY) ?? [];
}

export function savePlayers(players: Player[]) {
  setJson(PLAYERS_KEY, players);
}

// Wolf
export function getWolfGames(): WolfGame[] {
  return (getJson<WolfGame[]>(WOLF_KEY) ?? []).filter((g) => g.completed);
}

export function saveWolfGame(game: WolfGame) {
  const games = getJson<WolfGame[]>(WOLF_KEY) ?? [];
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) games[idx] = game;
  else games.unshift(game);
  setJson(WOLF_KEY, games);
}

export function getActiveWolfGame(): WolfGame | null {
  return getJson<WolfGame>(WOLF_ACTIVE_KEY);
}

export function setActiveWolfGame(game: WolfGame | null) {
  if (game) setJson(WOLF_ACTIVE_KEY, game);
  else localStorage.removeItem(WOLF_ACTIVE_KEY);
}

// Skins
export function getSkinsGames(): SkinsGame[] {
  return (getJson<SkinsGame[]>(SKINS_KEY) ?? []).filter((g) => g.completed);
}

export function saveSkinsGame(game: SkinsGame) {
  const games = getJson<SkinsGame[]>(SKINS_KEY) ?? [];
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) games[idx] = game;
  else games.unshift(game);
  setJson(SKINS_KEY, games);
}

export function getActiveSkinsGame(): SkinsGame | null {
  return getJson<SkinsGame>(SKINS_ACTIVE_KEY);
}

export function setActiveSkinsGame(game: SkinsGame | null) {
  if (game) setJson(SKINS_ACTIVE_KEY, game);
  else localStorage.removeItem(SKINS_ACTIVE_KEY);
}

// Wager History
export function getWagerHistory(): WagerEntry[] {
  return getJson<WagerEntry[]>(WAGERS_KEY) ?? [];
}

export function addWagerEntry(entry: WagerEntry) {
  const history = getWagerHistory();
  history.unshift(entry);
  setJson(WAGERS_KEY, history);
}
