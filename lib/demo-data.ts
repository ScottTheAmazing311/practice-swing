import { SavedSession, ClubRating, ClubFeedback } from './types';

const STORAGE_KEY = 'practice-swing-sessions';

const MOCK_SESSIONS: SavedSession[] = [
  {
    id: 'example',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Example session — your logs will appear here!',
    video_url: null,
    discord_shared: false,
    balls_hit: undefined,
    session_clubs: [
      { id: 'c1', club: 'Driver', rating: 7 },
      { id: 'c2', club: 'Irons', rating: 8 },
      { id: 'c3', club: 'Wedges', rating: 6 },
    ],
    session_feedback: {
      Driver: { accuracy: 4, power: 3, consistency: 50, bodyRotation: 1 },
      Irons: { accuracy: 3, power: 2, consistency: 75, compression: 1 },
      Wedges: { accuracy: 3, power: 1, consistency: 25 },
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
  // Show example only if user has no real sessions yet
  if (stored.length > 0) return stored;
  return [...MOCK_SESSIONS];
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
