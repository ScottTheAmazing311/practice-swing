export interface LeaderboardEntry {
  id: string;
  username: string;
  course: string;
  totalPoints: number;
  holeCount: 9 | 18;
  date: string;
  roundId: string;
}

const USERNAME_KEY = 'swang-username';
const FRIENDS_KEY = 'swang-friends';
const LEADERBOARD_KEY = 'swang-leaderboard';

// --- Username ---

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USERNAME_KEY) || null;
}

export function setUsername(name: string) {
  localStorage.setItem(USERNAME_KEY, name.toUpperCase().slice(0, 8));
}

// --- Friends ---

export function getFriends(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addFriend(name: string): boolean {
  const upper = name.toUpperCase().slice(0, 8);
  if (!upper) return false;
  const friends = getFriends();
  if (friends.includes(upper)) return false;
  const own = getUsername();
  if (own && upper === own) return false;
  friends.push(upper);
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  return true;
}

export function removeFriend(name: string) {
  const friends = getFriends().filter((f) => f !== name);
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
}

// --- Leaderboard ---

function getEntries(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setEntries(entries: LeaderboardEntry[]) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function addLeaderboardEntry(entry: LeaderboardEntry) {
  const entries = getEntries();
  // Replace if same roundId exists
  const idx = entries.findIndex((e) => e.roundId === entry.roundId);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  setEntries(entries);
}

export function addManualScore(username: string, course: string, totalPoints: number, holeCount: 9 | 18) {
  const entry: LeaderboardEntry = {
    id: `lb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username: username.toUpperCase().slice(0, 8),
    course,
    totalPoints,
    holeCount,
    date: new Date().toISOString(),
    roundId: `manual-${Date.now()}`,
  };
  addLeaderboardEntry(entry);
  return entry;
}

export function getLeaderboard(): LeaderboardEntry[] {
  return getEntries().sort((a, b) => b.totalPoints - a.totalPoints);
}

export function getLeaderboardForUser(username: string): LeaderboardEntry[] {
  return getEntries()
    .filter((e) => e.username === username)
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export function getCrewLeaderboard(): LeaderboardEntry[] {
  const own = getUsername();
  const friends = getFriends();
  const crew = own ? [own, ...friends] : friends;
  return getEntries()
    .filter((e) => crew.includes(e.username))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export function deleteLeaderboardEntry(id: string) {
  setEntries(getEntries().filter((e) => e.id !== id));
}
