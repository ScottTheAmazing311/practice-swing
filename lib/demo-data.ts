import { SavedSession, ClubRating, ClubFeedback } from './types';

const STORAGE_KEY = 'practice-swing-sessions';

const MOCK_SESSIONS: SavedSession[] = [
  {
    id: 'demo-1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Focused on keeping left arm straight through impact. Feeling good about tempo.',
    video_url: null,
    discord_shared: false,
    balls_hit: 65,
    session_clubs: [
      { id: 'c1', club: 'Driver', rating: 7 },
      { id: 'c2', club: 'Irons', rating: 8 },
      { id: 'c3', club: 'Wedges', rating: 6 },
    ],
    session_feedback: {
      Driver: { accuracy: 4, power: 3, consistency: 50, bodyRotation: true },
      Irons: { accuracy: 3, power: 2, consistency: 75, inTheSlot: true },
      Wedges: { accuracy: 3, power: 1, consistency: 25, takeAway: false },
    },
    session_disciplines: [],
  },
  {
    id: 'demo-2',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    notes: null,
    video_url: null,
    discord_shared: true,
    balls_hit: 40,
    session_clubs: [
      { id: 'c4', club: 'Irons', rating: 5 },
      { id: 'c5', club: 'Hybrids', rating: 7 },
      { id: 'c6', club: 'Wedges', rating: 4 },
      { id: 'c7', club: 'Putter', rating: 9 },
    ],
    session_feedback: {
      Irons: { accuracy: 1, power: 2, consistency: 25, headMovement: false },
      Putter: { putting: 4, inTheSlot: true },
    },
    session_disciplines: [],
  },
];

function getStoredSessions(): SavedSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeSession(session: SavedSession) {
  if (typeof window === 'undefined') return;
  const existing = getStoredSessions();
  existing.unshift(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getDemoSessions(): SavedSession[] {
  const stored = getStoredSessions();
  return [...stored, ...MOCK_SESSIONS];
}

export function saveDemoSession(
  ratings: ClubRating[],
  feedback: Record<string, ClubFeedback>,
  ballsHit: number,
  notes: string,
  discordShared: boolean
): SavedSession {
  const session: SavedSession = {
    id: `demo-${Date.now()}`,
    created_at: new Date().toISOString(),
    notes: notes.trim() || null,
    video_url: null,
    discord_shared: discordShared,
    balls_hit: ballsHit || undefined,
    session_clubs: ratings.map((r, i) => ({
      id: `sc-${Date.now()}-${i}`,
      club: r.club,
      rating: r.rating,
    })),
    session_feedback: feedback,
    session_disciplines: [],
  };
  storeSession(session);
  return session;
}
