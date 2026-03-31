export interface SwingHole {
  hole: number;
  par: number;
  score: number;
}

export interface SwingRound {
  id: string;
  created_at: string;
  course: string;
  holes: SwingHole[];
  hole_count: 9 | 18;
  completed: boolean;
}
