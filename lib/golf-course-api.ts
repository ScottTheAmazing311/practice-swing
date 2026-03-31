const API_BASE = 'https://api.golfcourseapi.com/v1';
const API_KEY = process.env.NEXT_PUBLIC_GOLF_API_KEY || '';

export interface GolfHole {
  par: number;
  yardage: number;
  handicap: number;
}

export interface GolfTeeBox {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  total_yards: number;
  par_total: number;
  number_of_holes: number;
  holes: GolfHole[];
}

export interface GolfCourse {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  tees: {
    male: GolfTeeBox[];
    female: GolfTeeBox[];
  };
}

export interface SearchResult {
  courses: GolfCourse[];
}

async function apiFetch<T>(path: string): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Key ${API_KEY}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function searchCourses(query: string): Promise<GolfCourse[]> {
  if (!query.trim() || !API_KEY) return [];
  const data = await apiFetch<SearchResult>(`/search?search_query=${encodeURIComponent(query)}`);
  return data?.courses ?? [];
}

export async function getCourseById(id: number): Promise<GolfCourse | null> {
  return apiFetch<GolfCourse>(`/courses/${id}`);
}

export function hasApiKey(): boolean {
  return !!API_KEY;
}
