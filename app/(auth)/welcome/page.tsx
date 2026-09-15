'use client';
// app/(auth)/welcome/page.tsx — sign in / sign up toggle.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Button, Field } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Welcome() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === 'signup';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) router.replace('/setup');
        else setError('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // The route guard in providers handles navigation once the session lands.
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="col" style={{ alignItems: 'center', gap: 'var(--sp-3)' }}>
        <Logo size={72} />
        <h1 className="title" style={{ textAlign: 'center' }}>
          Music Practice Journal
        </h1>
        <p className="body muted" style={{ textAlign: 'center' }}>
          Plan, reflect, and track your practice — week by week.
        </p>
      </div>

      <form className="col gap-4" onSubmit={onSubmit}>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined}
        />

        {!isSignUp && (
          <Link href="/forgot-password" className="caption text-primary-c" style={{ alignSelf: 'flex-end' }}>
            Forgot password?
          </Link>
        )}

        <Button title={isSignUp ? 'Create account' : 'Sign in'} type="submit" loading={loading} block />

        {isSignUp && (
          <p className="caption muted" style={{ textAlign: 'center' }}>
            For students under 13, a parent or guardian should create the account.
          </p>
        )}
      </form>

      <button
        type="button"
        className="body"
        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}
        onClick={() => {
          setMode(isSignUp ? 'signin' : 'signup');
          setError(null);
        }}
      >
        <span className="muted">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
        </span>
        <span className="text-primary-c">{isSignUp ? 'Sign in' : 'Create one'}</span>
      </button>
    </>
  );
}
