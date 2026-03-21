'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IS_DEMO, getSupabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (IS_DEMO) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm anim-fade-up">
          <h1 className="font-display text-2xl text-text mb-3">Demo Mode</h1>
          <p className="text-text-muted text-sm mb-6">
            Sign-in is disabled. Configure Supabase environment variables to enable accounts.
          </p>
          <Link href="/" className="text-accent text-sm font-medium hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = getSupabase();
    if (!supabase) return;
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  };

  const handleGoogle = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm anim-fade-up">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl text-text mb-2">Practice Swing</h1>
          <p className="text-text-muted text-sm">Sign in to save your sessions.</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-5" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
          {!sent ? (
            <>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
                {error && <p className="text-danger text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 min-h-[48px]"
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-bg-card text-[10px] text-text-muted uppercase tracking-wider">or</span>
                </div>
              </div>

              <button
                onClick={handleGoogle}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-border text-text hover:bg-bg-input transition-all duration-200 active:scale-[0.98] min-h-[48px]"
              >
                Continue with Google
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-text font-medium text-sm mb-1">Check your inbox</p>
              <p className="text-text-muted text-xs">
                We sent a link to <strong className="text-text">{email}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
