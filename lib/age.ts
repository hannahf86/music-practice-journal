// lib/age.ts — age helpers for the sign-up age gate.
import { differenceInYears, parseISO, isValid } from 'date-fns';

export function ageFromDOB(dob: string): number | null {
  const d = parseISO(dob);
  if (!isValid(d)) return null;
  return differenceInYears(new Date(), d);
}

// Accepts DD/MM/YYYY or YYYY-MM-DD and returns an ISO date string, or null.
export function normaliseDOB(input: string): string | null {
  const trimmed = input.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (iso.test(trimmed)) return trimmed;
  const m = trimmed.match(dmy);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}
