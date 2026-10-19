'use client';
// app/(app)/layout.tsx — authenticated shell: guards on session+profile, then a responsive
// frame — desktop sidebar + centred content, mobile bottom tab bar.
import { useAuthStore } from '@/store/auth';
import { TabBar } from '@/components/TabBar';
import { SideNav } from '@/components/SideNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isInitialised = useAuthStore((s) => s.isInitialised);

  // The provider guard redirects; render a loader until we truly have a profile so
  // child pages never run their queries with a null user.
  if (!isInitialised || !session || !profile) {
    return (
      <div className="loader">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-frame">
      <SideNav />
      <div className="app-content">{children}</div>
      <TabBar />
    </div>
  );
}
