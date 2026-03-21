import { ClubRating, ClubFeedback } from './types';

const ACCURACY_LABELS = ['Hook City', "Hookin'", 'Good Fade', 'Straight', 'Good Draw', "Slicin'", 'Slice Town'];
const POWER_LABELS = ['Pathetic', 'Fine', 'Decent', 'Good', 'Juiced'];
const PUTTING_LABELS = ['Awful', 'Meh', 'OK', 'Solid', 'Tiger'];

export function generateDiscordText(
  ratings: ClubRating[],
  feedback: Record<string, ClubFeedback>,
  ballsHit: number,
  notes: string,
  videoUrl: string | null
): string {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const clubLines = ratings.map((r) => `  ${r.club} -- ${r.rating}/10`).join('\n');

  let text = `Practice Swing -- ${date}\n\nClubs Worked:\n${clubLines}`;

  const highlights: string[] = [];
  Object.entries(feedback).forEach(([club, fb]) => {
    if (fb.accuracy !== undefined) highlights.push(`${club}: ${ACCURACY_LABELS[fb.accuracy]}`);
    if (fb.power !== undefined) highlights.push(`Power: ${POWER_LABELS[fb.power]}`);
    if (fb.consistency !== undefined) highlights.push(`${fb.consistency}% good shots`);
    if (fb.putting !== undefined) highlights.push(`Putting: ${PUTTING_LABELS[fb.putting]}`);
  });

  if (highlights.length > 0) text += `\n\n${highlights.join(' | ')}`;
  if (ballsHit > 0) text += `\n${ballsHit >= 100 ? '100+' : ballsHit} balls hit`;
  if (notes.trim()) text += `\n\nNotes: ${notes.trim()}`;
  if (videoUrl) text += `\n\nVideo: ${videoUrl}`;

  return text;
}
