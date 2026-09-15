'use client';
// components/TabBar.tsx — role-aware bottom navigation.
// Student: Home · Plan · Review · Progress   |   Teacher: Home · Students · Progress
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

type Tab = { href: string; label: string; icon: string };

const STUDENT_TABS: Tab[] = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/plan', label: 'Plan', icon: '📅' },
  { href: '/review', label: 'Review', icon: '✍️' },
  { href: '/progress', label: 'Progress', icon: '📈' },
];

const TEACHER_TABS: Tab[] = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/students', label: 'Students', icon: '🎓' },
  { href: '/progress', label: 'Progress', icon: '📈' },
];

export function TabBar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.profile?.role);
  const tabs = role === 'teacher' ? TEACHER_TABS : STUDENT_TABS;

  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className={`tab ${active ? 'tab--active' : ''}`}>
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
