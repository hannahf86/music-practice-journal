'use client';
// components/SideNav.tsx — desktop sidebar navigation (CSS hides it below 880px).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { navFor } from '@/lib/nav';
import { Logo } from '@/components/Logo';

export function SideNav() {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);
  const items = navFor(profile?.role);

  function signOut() {
    if (window.confirm('Sign out?')) useAuthStore.getState().signOut();
  }

  return (
    <aside className="side-nav">
      <div className="side-brand">
        <Logo size={34} />
        <span className="side-brand-name">Practice Journal</span>
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
      <button type="button" className="side-link side-signout" onClick={signOut}>
        <span className="tab-icon">↩</span>
        Sign out
      </button>
    </aside>
  );
}
