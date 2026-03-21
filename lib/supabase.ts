import { createBrowserClient } from '@supabase/ssr';

export const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getSupabase() {
  if (IS_DEMO) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
