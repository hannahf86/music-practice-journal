// lib/supabase.ts — browser Supabase client for the Next.js web app.
// Session persists in localStorage (the supabase-js default) — fine for a client-side,
// login-gated SPA. All client env vars are NEXT_PUBLIC_*.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaces a missing .env.local early rather than as an opaque network failure.
  console.warn(
    '[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.local.example to .env.local and fill in your project values.',
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      // Guard against SSR: only touch window storage in the browser.
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: true,
      detectSessionInUrl: true, // needed for password-reset / magic-link redirects
    },
  },
);
