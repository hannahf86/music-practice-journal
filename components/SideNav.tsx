'use client';
// components/SideNav.tsx — desktop sidebar: brand block, role-aware nav, tagline, user footer.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { navFor } from '@/lib/nav';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/Avatar';
import type { UserRole } from '@/types/database';

const COPY: Record<UserRole, { subtitle: string; tagline: string; roleLabel: string }> = {
  teacher: { subtitle: 'The teacher workspace', tagline: 'Room to teach. Space to grow.', roleLabel: 'Teacher' },
  student: { subtitle: 'Your practice journal', tagline: 'Small steps, steady progress.', roleLabel: 'Student' },
  parent_proxy: { subtitle: 'Family view', tagline: 'Cheering them on, every week.', roleLabel: 'Parent' },
};

export function SideNav() {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);
  const items = navFor(profile?.role);
  const copy = COPY[profile?.role ?? 'student'];

  function signOut() {
    if (window.confirm('Sign out?')) useAuthStore.getState().signOut();
  }

  return (
    <aside className="side-nav">
      <div className="side-brand">
        <Logo size={30} />
        <div>
          <div className="side-brand-name display">music practice journal</div>
          <div className="kicker" style={{ marginTop: 2 }}>{copy.subtitle}</div>
        </div>
      </div>

      <nav className="side-links">
        {items.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`side-link ${pathname === t.href ? 'side-link--active' : ''}`}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="side-tagline">
        <div className="kicker">A little, often.</div>
        <div className="display side-tagline-text">{copy.tagline}</div>
      </div>

      <div className="side-foot">
        <div className="row">
          <Avatar name={profile?.full_name} size={34} />
          <div className="grow">
            <div className="side-foot-name">{profile?.full_name || 'Your account'}</div>
            <div className="caption muted">{copy.roleLabel}</div>
          </div>
        </div>
        <div className="side-foot-actions">
          <span className="linkbtn linkbtn--muted">Account</span>
          <span className="muted">·</span>
          <button type="button" className="linkbtn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
