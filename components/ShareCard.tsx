'use client';

import { ClubRating, ClubFeedback } from '@/lib/types';

const RATING_COLORS = [
  '#EF4444', '#F87171', '#FB923C', '#FBBF24', '#FACC15',
  '#A3E635', '#4ADE80', '#34D399', '#2DD4BF', '#22D3EE',
];

const ACCURACY_LABELS = ['Hook City', "Hookin'", 'Good Fade', 'Straight', 'Good Draw', "Slicin'", 'Slice Town'];
const POWER_LABELS = ['Pathetic', 'Fine', 'Decent', 'Good', 'Juiced'];
const PUTTING_LABELS = ['Awful', 'Meh', 'OK', 'Solid', 'Tiger'];

export default function ShareCard({
  ratings,
  feedback,
  notes,
  vibeEmoji,
  grindLocation,
}: {
  ratings: ClubRating[];
  feedback: Record<string, ClubFeedback>;
  notes?: string;
  vibeEmoji?: string;
  grindLocation?: string;
}) {
  return (
    <div
      className="bg-bg-card border border-border rounded-2xl p-5 space-y-5"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      {/* Header */}
      <div>
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">
          Practice Swing
        </p>
        <p className="text-sm text-text-muted">
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Grind location */}
      {grindLocation && (
        <p className="text-xs text-text-muted">
          <span className="text-text/70 font-medium capitalize">{grindLocation}</span> session
        </p>
      )}

      {/* Wordle-style grid */}
      <div className="space-y-2">
        {ratings.map((r) => (
          <div key={r.club} className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-20 text-right truncate shrink-0">
              {r.club}
            </span>
            <div className="flex gap-[3px] flex-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="h-5 flex-1 rounded-[3px] transition-all duration-200"
                  style={{
                    background: i < r.rating ? RATING_COLORS[r.rating - 1] : '#1A2B1E',
                    opacity: i < r.rating ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
            <span
              className="text-xs font-bold tabular-nums w-6 text-right"
              style={{ color: RATING_COLORS[r.rating - 1] }}
            >
              {r.rating}
            </span>
          </div>
        ))}
      </div>

      {/* Feedback summary tags */}
      {Object.keys(feedback).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(feedback).map(([club, fb]) => {
            const tags: { label: string; color: string }[] = [];
            if (fb.accuracy !== undefined) {
              const isGood = fb.accuracy >= 2 && fb.accuracy <= 4;
              tags.push({ label: `${club}: ${ACCURACY_LABELS[fb.accuracy]}`, color: isGood ? 'accent' : 'danger' });
            }
            if (fb.power !== undefined) {
              tags.push({ label: `${club}: ${POWER_LABELS[fb.power]}`, color: fb.power >= 3 ? 'accent' : 'text-muted' });
            }
            if (fb.putting !== undefined) {
              tags.push({ label: `Putting: ${PUTTING_LABELS[fb.putting]}`, color: fb.putting >= 3 ? 'accent' : 'text-muted' });
            }
            return tags.map((t, i) => (
              <span
                key={`${club}-${i}`}
                className={`text-[10px] font-medium rounded-md px-2 py-0.5 border
                  ${t.color === 'accent'
                    ? 'bg-accent/10 text-accent border-accent/20'
                    : t.color === 'danger'
                      ? 'bg-danger/10 text-danger border-danger/20'
                      : 'bg-bg-input text-text-muted border-border'
                  }
                `}
              >
                {t.label}
              </span>
            ));
          })}
        </div>
      )}

      {/* Notes */}
      {notes && notes.trim() && (
        <p className="text-xs text-text/70 italic">
          &ldquo;{notes.trim()}&rdquo;
        </p>
      )}

      {/* Vibe emoji */}
      {vibeEmoji && (
        <div>
          <p className="text-[10px] text-text-muted/60 uppercase tracking-wider mb-1">Today I hit like:</p>
          <span className="text-2xl">{vibeEmoji}</span>
        </div>
      )}
    </div>
  );
}

// Club emoji mapping
const CLUB_EMOJI: Record<string, string> = {
  Driver: '\u{1F697}',   // car
  Woods: '\u{1FAB5}',    // wood
  Hybrids: '\u{1F9EC}',  // dna
  Irons: '\u26CF\uFE0F', // pickaxe
  Wedges: '\u{1F9C0}',   // cheese
  Putter: '\u{1F3D2}',   // hockey
};

// Rating to square color
function ratingSquare(rating: number): string {
  if (rating <= 3) return '\u{1F7E5}'; // red
  if (rating <= 5) return '\u{1F7E8}'; // yellow
  if (rating <= 7) return '\u{1F7E9}'; // green
  return '\u{1F7E6}';                  // blue
}

// Feedback category to ball color
function skillBall(value: number | undefined, type: 'accuracy' | 'power' | 'consistency' | 'feels'): string {
  const green = '\u{1F7E2}';
  const yellow = '\u{1F7E1}';
  const red = '\u{1F534}';

  if (value === undefined) return '\u26AB'; // black = not rated

  switch (type) {
    case 'accuracy':
      // 3 = Straight (best), 2/4 = good, 1/5 = meh, 0/6 = bad
      if (value === 3) return green;
      if (value === 2 || value === 4) return green;
      if (value === 1 || value === 5) return yellow;
      return red;
    case 'power':
      // 0=Pathetic, 1=Fine, 2=Decent, 3=Good, 4=Juiced
      if (value >= 3) return green;
      if (value === 2) return yellow;
      return red;
    case 'consistency':
      // 25, 50, 75, 100
      if (value >= 75) return green;
      if (value === 50) return yellow;
      return red;
    case 'feels':
      // Aggregate: value = net score (greens - reds)
      if (value >= 2) return green;
      if (value >= 0) return yellow;
      return red;
  }
}

function getFeelsScore(fb: ClubFeedback): number {
  let score = 0;
  const keys = ['takeAway', 'bodyRotation', 'weightTransfer', 'compression'] as const;
  for (const k of keys) {
    const v = fb[k];
    if (typeof v === 'number') score += v;
  }
  return score;
}

export function generateShareText(
  ratings: ClubRating[],
  feedback: Record<string, ClubFeedback>,
  notes: string,
  vibeEmoji?: string,
  grindLocation?: string
): string {
  const empty = '\u2B1B'; // black square

  // Club rows
  const clubLines = ratings.map((r) => {
    const emoji = CLUB_EMOJI[r.club] ?? '\u26F3';
    const squares = Array.from({ length: 10 }, (_, i) =>
      i < r.rating ? ratingSquare(r.rating) : empty
    ).join('');
    return `${emoji} ${squares}`;
  }).join('\n');

  // Aggregate skills across all clubs
  let accVal: number | undefined;
  let powVal: number | undefined;
  let conVal: number | undefined;
  let feelsVal: number | undefined;

  const fbEntries = Object.values(feedback);
  if (fbEntries.length > 0) {
    const accs = fbEntries.filter(fb => fb.accuracy !== undefined).map(fb => fb.accuracy!);
    const pows = fbEntries.filter(fb => fb.power !== undefined).map(fb => fb.power!);
    const cons = fbEntries.filter(fb => fb.consistency !== undefined).map(fb => fb.consistency!);

    if (accs.length > 0) accVal = Math.round(accs.reduce((a, b) => a + b, 0) / accs.length);
    if (pows.length > 0) powVal = Math.round(pows.reduce((a, b) => a + b, 0) / pows.length);
    if (cons.length > 0) conVal = Math.round(cons.reduce((a, b) => a + b, 0) / cons.length);

    // Feels: aggregate across all clubs
    let totalFeels = 0;
    let feelsCount = 0;
    fbEntries.forEach(fb => {
      const keys = ['takeAway', 'bodyRotation', 'weightTransfer', 'compression'] as const;
      const hasAny = keys.some(k => fb[k] !== undefined);
      if (hasAny) {
        totalFeels += getFeelsScore(fb);
        feelsCount++;
      }
    });
    if (feelsCount > 0) feelsVal = totalFeels;
  }

  const skillDots = [
    skillBall(accVal, 'accuracy'),
    skillBall(powVal, 'power'),
    skillBall(conVal, 'consistency'),
    skillBall(feelsVal, 'feels'),
  ].join('');

  const LOCATION_EMOJI: Record<string, string> = { net: '\u{1F3E0}', sim: '\u{1F3AE}', range: '\u{1F3CC}\uFE0F' };
  const locationLine = grindLocation ? `${LOCATION_EMOJI[grindLocation] ?? ''} ${grindLocation.charAt(0).toUpperCase() + grindLocation.slice(1)} session` : '';

  let text = `Practice Swing${locationLine ? `\n${locationLine}` : ''}\n\nClubs\n${clubLines}\n\nSkills\n${skillDots}`;

  if (notes && notes.trim()) {
    text += `\n\n"${notes.trim()}"`;
  }

  if (vibeEmoji) {
    text += `\n\nToday I hit like:\n${vibeEmoji}`;
  }

  text += '\n\npracticeswing.app\nhttps://practice-swing.vercel.app/';

  return text;
}
