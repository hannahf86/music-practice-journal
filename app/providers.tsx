'use client';
// app/providers.tsx — QueryClientProvider + Supabase auth listener + client-side route guard.
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

const AUTH_ROUTES = ['/welcome', '/setup', '/teacher-declaration', '/forgot-password'];

// Wires supabase auth state into the Zustand store.
function useAuthListener() {
  const setSession = useAuthStore((s) => s.setSession);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const setInitialised = useAuthStore((s) => s.setInitialised);
  const setProfile = useAuthStore((s) => s.setProfile);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) await fetchProfile(session.user.id);
      setInitialised(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) await fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [setSession, fetchProfile, setInitialised, setProfile]);
}

// Redirects based on session + profile, mirroring the native app's route guard.
function useRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isInitialised = useAuthStore((s) => s.isInitialised);

  useEffect(() => {
    if (!isInitialised) return;
    const inAuth = AUTH_ROUTES.includes(pathname);

    if (!session) {
      if (!inAuth) router.replace('/welcome');
    } else if (!profile) {
      // Signed in but no profile yet → finish setup (don't fight the screens that create it).
      if (pathname !== '/setup' && pathname !== '/teacher-declaration') router.replace('/setup');
    } else {
      // Signed in with a profile → leave the auth area, but let a new teacher finish the
      // declaration screen before bouncing to home.
      if ((inAuth && pathname !== '/teacher-declaration') || pathname === '/') {
        router.replace('/home');
      }
    }
  }, [session, profile, isInitialised, pathname, router]);
}

function Gate({ children }: { children: React.ReactNode }) {
  useAuthListener();
  useRouteGuard();
  const isInitialised = useAuthStore((s) => s.isInitialised);

  if (!isInitialised) {
    return (
      <div className="loader">
        <div className="spinner" />
      </div>
    );
  }
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Gate>{children}</Gate>
    </QueryClientProvider>
  );
}
