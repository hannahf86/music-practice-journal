'use client';
// components/TabBar.tsx — role-aware bottom navigation (mobile only; CSS hides it ≥880px).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { navFor } from '@/lib/nav';

export function TabBar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.profile?.role);
  const items = navFor(role);

  return (
    <nav className="tabbar">
      {items.map((t) => (
        <Link key={t.href} href={t.href} className={`tab ${pathname === t.href ? 'tab--active' : ''}`}>
          <span className="tab-icon">{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
