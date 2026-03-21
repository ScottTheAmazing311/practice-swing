import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // No auth check if Supabase is not configured (demo mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next();
  }

  // For now, let all requests through.
  // When Supabase is configured, this would check the session cookie
  // and redirect unauthenticated users to /login.
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/session', '/history'],
};
