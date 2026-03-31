export interface Player {
  id: string;
  name: string;
}

export interface WolfHole {
  hole: number;
  wolfIndex: number;
  partnerIndex: number | null; // null = wolf goes alone
  scores: number[]; // per player
  wolfTeamWon: boolean;
  points: number; // points awarded to winning side
}

export interface WolfGame {
  id: string;
  created_at: string;
  players: Player[]; // exactly 4
  holes: WolfHole[];
  scores: number[]; // running total per player
  currentHole: number;
  completed: boolean;
}

export interface SkinsHole {
  hole: number;
  scores: number[]; // per player
  winnerIndex: number | null; // null = carry
  skinsWorth: number; // how many skins this hole is worth (carries)
}

export interface SkinsGame {
  id: string;
  created_at: string;
  players: Player[]; // 2-6
  holes: SkinsHole[];
  skinsWon: number[]; // per player
  currentHole: number;
  hole_count: 9 | 18;
  carryOver: number;
  completed: boolean;
}

export interface WagerEntry {
  id: string;
  created_at: string;
  gameType: 'wolf' | 'skins';
  players: string[]; // player names
  results: number[]; // net per player
}
