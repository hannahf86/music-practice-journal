// lib/date.ts — week + term helpers (Monday-based weeks, 13-week term)
import {
  startOfWeek,
  endOfWeek,
  format,
  differenceInCalendarDays,
  addWeeks,
} from 'date-fns';
import type { DayOfWeek } from '@/types/database';

export const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export const TERM_WEEKS = 13;

// ISO week start (Monday) as an ISO date string, for a given reference date.
export function weekStartISO(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart);
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`;
}

export function todayDayOfWeek(date: Date = new Date()): DayOfWeek {
  // date-fns getDay: 0 = Sunday … 6 = Saturday
  const idx = (date.getDay() + 6) % 7; // shift so Monday = 0
  return DAYS[idx];
}

export function daysUntil(dueDate: string): number {
  return differenceInCalendarDays(new Date(dueDate), new Date());
}

export function prettyDate(date: string | Date, fmt = 'EEEE d MMMM'): string {
  return format(new Date(date), fmt);
}

// The Monday ISO date for a given week number within a term, from the term start.
export function weekStartForNumber(termStart: string, weekNumber: number): string {
  return format(addWeeks(new Date(termStart), weekNumber - 1), 'yyyy-MM-dd');
}
