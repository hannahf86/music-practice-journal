// lib/nav.ts — role-aware navigation items, shared by the mobile tab bar and desktop sidebar.
import type { UserRole } from '@/types/database';

export type NavItem = { href: string; label: string; icon: string };

const STUDENT_NAV: NavItem[] = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/plan', label: 'Plan', icon: '📅' },
  { href: '/review', label: 'Review', icon: '✍️' },
  { href: '/progress', label: 'Progress', icon: '📈' },
];

const TEACHER_NAV: NavItem[] = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/students', label: 'Students', icon: '🎓' },
  { href: '/progress', label: 'Progress', icon: '📈' },
];

export function navFor(role?: UserRole | null): NavItem[] {
  return role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
}
