export interface SwangShot {
  club: string;
  grade: number; // 0-5
  vibes?: number; // 0-10
}

export const VIBE_LABELS = [
  'Awful', 'Pain', 'Rough', 'Meh', 'Fine',
  'Decent', 'Good', 'Vibin', 'Electric', 'Unreal', 'Goated',
] as const;

export type HoleResult = 'double_bogey_plus' | 'bogey' | 'par' | 'birdie' | 'eagle_plus';

export const HOLE_RESULT_POINTS: Record<HoleResult, number> = {
  double_bogey_plus: -5,
  bogey: -3,
  par: 3,
  birdie: 5,
  eagle_plus: 10,
};

export const HOLE_RESULT_LABELS: Record<HoleResult, string> = {
  double_bogey_plus: 'Double Bogey+',
  bogey: 'Bogey',
  par: 'Par',
  birdie: 'Birdie',
  eagle_plus: 'Eagle+',
};

export const BONUS_REASONS = [
  'Unreal Shot',
  'Clutch Putt',
  'High Vibes',
  'Broke the Curse',
  'Best Drive of the Day',
  'Recovery Shot',
  'Stuck It Close',
  'Played It Smart',
  'Sand Save',
  'Kept It Together',
] as const;

export const MAX_BONUS = 5;

export interface SwangHole {
  hole: number;
  shots: SwangShot[];
  result: HoleResult;
  bonuses: string[];
  bonusPoints: number;
  shotTotal: number;
  resultPoints: number;
  holeTotal: number;
}

export interface SwangHoleInfo {
  par: number;
  yardage: number;
  handicap: number;
}

export interface SwangRound {
  id: string;
  created_at: string;
  course: string;
  holes: SwangHole[];
  hole_count: 9 | 18;
  completed: boolean;
  totalPoints: number;
  username?: string;
  holeInfo?: SwangHoleInfo[];
}

export type SwangView =
  | 'shot_club'
  | 'shot_grade'
  | 'shot_vibes'
  | 'hole_result'
  | 'bonus'
  | 'hole_summary';
