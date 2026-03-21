export interface ClubRating {
  club: string;
  rating: number;
}

export interface ClubFeedback {
  accuracy?: number;        // 0-6: Hook City(0) → Straight(3) → Slice Town(6)
  power?: number;           // 0-4: Pathetic(0) → Juiced(4)
  consistency?: number;     // 1, 25, 50, 75, 100
  inTheSlot?: boolean;
  takeAway?: boolean;
  headMovement?: boolean;
  bodyRotation?: boolean;
  putting?: number;         // 0-4: Awful(0) → Tiger(4) — putter only
}

export interface SessionData {
  clubs: string[];
  ratings: ClubRating[];
  feedback: Record<string, ClubFeedback>;
  ballsHit: number;
  notes: string;
  videoFile: File | null;
}

// Keep for backwards compat with saved data
export interface DisciplineStatus {
  discipline: string;
  status: 'improving' | 'struggling' | null;
}

export interface SavedSession {
  id: string;
  created_at: string;
  notes: string | null;
  video_url: string | null;
  discord_shared: boolean;
  balls_hit?: number;
  session_clubs: { id: string; club: string; rating: number }[];
  session_feedback?: Record<string, ClubFeedback>;
  // Legacy
  session_disciplines: {
    id: string;
    discipline: string;
    status: 'improving' | 'struggling';
  }[];
}
