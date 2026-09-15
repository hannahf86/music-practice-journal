'use client';
// app/(auth)/forgot-password/page.tsx — password reset request.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button, Field } from '@/components/ui';

const emailSchema = z.string().email('Enter a valid email');

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/welcome` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="col gap-2">
        <h1 className="title">Reset your password</h1>
        <p className="body muted">Enter the email on your account and we&apos;ll send a reset link.</p>
      </div>
      {sent ? (
        <p className="body text-success">Check your email for a reset link.</p>
      ) : (
        <form className="col gap-4" onSubmit={onSubmit}>
          <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={error ?? undefined} />
          <Button title="Send reset link" type="submit" loading={loading} block />
        </form>
      )}
      <Button title="Back to sign in" variant="ghost" onClick={() => router.replace('/welcome')} block />
    </>
  );
}
