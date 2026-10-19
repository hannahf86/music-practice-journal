'use client';
// app/(auth)/reset-password/page.tsx — set a new password after following the email reset link.
// Supabase's recovery link creates a short-lived session and lands here; the user sets a new
// password via updateUser(), then continues into the app.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button, Field } from '@/components/ui';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Confirm we actually arrived with a recovery session (link followed), not direct navigation.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setReady(!!session));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Recovery session is now a normal session — straight into the app.
      router.replace('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="col gap-2">
        <h1 className="title">Choose a new password</h1>
        <p className="body muted">Enter a new password for your account.</p>
      </div>

      {!ready ? (
        <p className="body muted">
          This page works from the reset link in your email. If you got here another way, request a
          new link from “Forgot password”.
        </p>
      ) : (
        <form className="col gap-4" onSubmit={onSubmit}>
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={error ?? undefined}
          />
          <Button title="Update password" type="submit" loading={loading} block />
        </form>
      )}

      <Button title="Back to sign in" variant="ghost" onClick={() => router.replace('/welcome')} block />
    </>
  );
}
