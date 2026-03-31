'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  getUsername,
  setUsername,
  getFriends,
  addFriend,
  removeFriend,
  getCrewLeaderboard,
  addManualScore,
  LeaderboardEntry,
} from '@/lib/swang-leaderboard';

type Tab = 'leaderboard' | 'crew' | 'add_score';

const RANK_COLORS = ['#FACC15', '#C0C0C0', '#CD7F32'];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [friends, setFriendsState] = useState<string[]>([]);
  const [friendInput, setFriendInput] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Add score form
  const [scoreUsername, setScoreUsername] = useState('');
  const [scoreCourse, setScoreCourse] = useState('');
  const [scorePoints, setScorePoints] = useState('');
  const [scoreHoles, setScoreHoles] = useState<9 | 18>(18);

  const refresh = () => {
    setMyUsername(getUsername());
    setFriendsState(getFriends());
    setLeaderboard(getCrewLeaderboard());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSetUsername = () => {
    const val = usernameInput.trim();
    if (!val) return;
    setUsername(val);
    setUsernameInput('');
    refresh();
  };

  const handleAddFriend = () => {
    const val = friendInput.trim();
    if (!val) return;
    addFriend(val);
    setFriendInput('');
    refresh();
  };

  const handleRemoveFriend = (name: string) => {
    removeFriend(name);
    refresh();
  };

  const handleAddScore = () => {
    const name = scoreUsername.trim();
    const course = scoreCourse.trim();
    const pts = parseInt(scorePoints);
    if (!name || !course || isNaN(pts)) return;
    addManualScore(name, course, pts, scoreHoles);
    setScoreUsername('');
    setScoreCourse('');
    setScorePoints('');
    setTab('leaderboard');
    refresh();
  };

  const crew = myUsername ? [myUsername, ...friends] : friends;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Leaderboard" onBack="/swang" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        {/* Username setup */}
        {!myUsername ? (
          <div className="anim-fade-up">
            <div
              className="bg-bg-card border border-accent/30 rounded-2xl p-6 space-y-4"
              style={{ boxShadow: '0 0 20px rgba(74, 222, 128, 0.05)' }}
            >
              <div className="text-center">
                <p className="text-text font-bold text-lg">Claim Your Tag</p>
                <p className="text-text-muted text-xs mt-1">Up to 8 characters, arcade style</p>
              </div>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toUpperCase().slice(0, 8))}
                placeholder="e.g. ACE"
                maxLength={8}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-center text-lg font-black tracking-[0.2em] text-accent placeholder:text-text-muted/30 focus:outline-none focus:border-accent/50 transition-colors duration-200"
                onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
              />
              <button
                onClick={handleSetUsername}
                disabled={!usernameInput.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Lock It In
              </button>
            </div>
          </div>
        ) : (
          <div className="anim-fade-up flex items-center justify-between bg-bg-card border border-border rounded-2xl px-4 py-3">
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Your Tag</p>
              <p className="text-accent font-black text-lg tracking-[0.15em]">{myUsername}</p>
            </div>
            <button
              onClick={() => { setMyUsername(null); localStorage.removeItem('swang-username'); }}
              className="text-[10px] text-text-muted hover:text-danger transition-colors px-2 py-1"
            >
              Change
            </button>
          </div>
        )}

        {/* Tabs */}
        {myUsername && (
          <>
            <div className="anim-fade-up flex gap-1 bg-bg-card border border-border rounded-xl p-1" style={{ animationDelay: '40ms' }}>
              {([
                { key: 'leaderboard' as Tab, label: 'Rankings' },
                { key: 'crew' as Tab, label: 'Crew' },
                { key: 'add_score' as Tab, label: 'Add Score' },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                    ${tab === t.key
                      ? 'bg-accent text-bg'
                      : 'text-text-muted hover:text-text'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Rankings tab */}
            {tab === 'leaderboard' && (
              <div className="anim-fade-up space-y-1" style={{ animationDelay: '80ms' }}>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-text-muted text-sm mb-2">No scores yet</p>
                    <p className="text-text-muted/60 text-xs">
                      Complete a round or add a friend&apos;s score
                    </p>
                  </div>
                ) : (
                  <div
                    className="bg-bg-card border border-border rounded-2xl overflow-hidden"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                  >
                    <div className="divide-y divide-border/50">
                      {leaderboard.map((entry, i) => {
                        const rank = i + 1;
                        const isMe = entry.username === myUsername;
                        const isTopThree = rank <= 3;
                        const date = new Date(entry.date);

                        return (
                          <div
                            key={entry.id}
                            className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-accent/5' : ''}`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black tabular-nums shrink-0"
                              style={{
                                background: isTopThree ? RANK_COLORS[rank - 1] + '20' : 'transparent',
                                color: isTopThree ? RANK_COLORS[rank - 1] : '#6B7280',
                                border: isTopThree ? `1px solid ${RANK_COLORS[rank - 1]}40` : '1px solid transparent',
                              }}
                            >
                              {rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold tracking-wider truncate ${isMe ? 'text-accent' : 'text-text'}`}>
                                {entry.username}
                              </p>
                              <p className="text-[10px] text-text-muted truncate">
                                {entry.course} - {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <p
                              className="text-lg font-black tabular-nums shrink-0"
                              style={{ color: entry.totalPoints >= 0 ? '#4ADE80' : '#F87171' }}
                            >
                              {entry.totalPoints >= 0 ? '+' : ''}{entry.totalPoints}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Crew tab */}
            {tab === 'crew' && (
              <div className="anim-fade-up space-y-4" style={{ animationDelay: '80ms' }}>
                {/* Add friend */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value.toUpperCase().slice(0, 8))}
                    placeholder="Add username"
                    maxLength={8}
                    className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-3 text-sm font-bold tracking-wider text-text placeholder:text-text-muted/30 focus:outline-none focus:border-accent/40 transition-colors duration-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  />
                  <button
                    onClick={handleAddFriend}
                    disabled={!friendInput.trim()}
                    className="px-5 py-3 rounded-xl font-semibold text-sm bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-30 shrink-0"
                  >
                    Add
                  </button>
                </div>

                {/* Crew list */}
                <div className="space-y-2">
                  {/* You */}
                  <div className="flex items-center justify-between bg-bg-card border border-accent/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <span className="text-accent text-xs font-black">{myUsername?.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm text-accent font-bold tracking-wider">{myUsername}</p>
                        <p className="text-[10px] text-text-muted">You</p>
                      </div>
                    </div>
                  </div>

                  {/* Friends */}
                  {friends.map((f) => (
                    <div key={f} className="flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-border/50 flex items-center justify-center">
                          <span className="text-text-muted text-xs font-black">{f.slice(0, 2)}</span>
                        </div>
                        <p className="text-sm text-text font-bold tracking-wider">{f}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(f)}
                        className="text-[10px] text-text-muted hover:text-danger transition-colors px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {friends.length === 0 && (
                    <p className="text-center text-text-muted/60 text-xs py-6">
                      Add your crew to see their scores on the leaderboard
                    </p>
                  )}
                </div>

                {crew.length > 0 && (
                  <p className="text-center text-text-muted/40 text-[10px] pt-2">
                    {crew.length} in your crew
                  </p>
                )}
              </div>
            )}

            {/* Add Score tab */}
            {tab === 'add_score' && (
              <div className="anim-fade-up space-y-4" style={{ animationDelay: '80ms' }}>
                <p className="text-xs text-text-muted text-center">
                  Manually add a friend&apos;s score to the leaderboard
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Username</p>
                    <input
                      type="text"
                      value={scoreUsername}
                      onChange={(e) => setScoreUsername(e.target.value.toUpperCase().slice(0, 8))}
                      placeholder="e.g. TIGER"
                      maxLength={8}
                      className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm font-bold tracking-wider text-text placeholder:text-text-muted/30 focus:outline-none focus:border-accent/40 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Course</p>
                    <input
                      type="text"
                      value={scoreCourse}
                      onChange={(e) => setScoreCourse(e.target.value)}
                      placeholder="e.g. Pine Valley"
                      className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-accent/40 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Total Points</p>
                    <input
                      type="number"
                      value={scorePoints}
                      onChange={(e) => setScorePoints(e.target.value)}
                      placeholder="e.g. 47"
                      className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-accent/40 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Holes</p>
                    <div className="flex gap-3">
                      {([9, 18] as const).map((n) => (
                        <button
                          key={n}
                          onClick={() => setScoreHoles(n)}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px]
                            ${scoreHoles === n
                              ? 'bg-accent text-bg'
                              : 'bg-bg-card border border-border text-text-muted hover:border-text-muted/40'
                            }`}
                        >
                          {n} Holes
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddScore}
                  disabled={!scoreUsername.trim() || !scoreCourse.trim() || !scorePoints.trim()}
                  className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed min-h-[56px]"
                >
                  Add to Leaderboard
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
