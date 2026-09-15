// lib/labels.ts — display labels for enum values, shared across screens.
import type { PracticeCategory, SelfRating } from '@/types/database';

export const CATEGORY_LABEL: Record<PracticeCategory, string> = {
  technical_work: 'Technical',
  sight_reading: 'Sight-reading',
  pieces: 'Pieces',
  musicianship: 'Musicianship',
};

export const RATING_LABEL: Record<SelfRating, string> = {
  not_my_best: 'Not my best',
  i_did_well: 'I did well',
  smashed_it: 'Smashed it!',
};

// Lesson-note / practice-note sections (4 cards).
export const NOTE_SECTIONS = [
  { key: 'technical_work', label: 'Technical Work' },
  { key: 'repertoire', label: 'Repertoire' },
  { key: 'sight_reading', label: 'Sight-Reading' },
  { key: 'musicianship', label: 'Musicianship' },
] as const;
