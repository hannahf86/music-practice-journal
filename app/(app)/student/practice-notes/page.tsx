'use client';
// app/(app)/student/practice-notes/page.tsx — student's PRIVATE reflections, autosaved on blur.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card, BackButton } from '@/components/ui';
import { NOTE_SECTIONS } from '@/lib/labels';
import { useCurrentLessonWeek, useEnsureCurrentWeek, usePracticeNotes, useSavePracticeNote } from '@/hooks/queries';
import type { PracticeSection } from '@/types/database';

export default function PracticeNotes() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const studentId = profile?.id;
  const { data: lessonWeek } = useCurrentLessonWeek(studentId);
  const ensureWeek = useEnsureCurrentWeek();
  const { data: notes = [] } = usePracticeNotes(lessonWeek?.id);
  const saveNote = useSavePracticeNote();

  useEffect(() => {
    if (studentId && !lessonWeek) ensureWeek.mutate(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, lessonWeek]);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const s of NOTE_SECTIONS) next[s.key] = notes.find((n) => n.section === s.key)?.note_text ?? '';
    setDrafts(next);
  }, [notes]);

  function persist(section: PracticeSection) {
    if (!studentId || !lessonWeek) return;
    const text = drafts[section] ?? '';
    const existing = notes.find((n) => n.section === section)?.note_text ?? '';
    if (text === existing) return;
    saveNote.mutate({ student_id: studentId, lesson_week_id: lessonWeek.id, section, note_text: text });
  }

  return (
    <main className="screen screen--flush">
      <BackButton onClick={() => router.back()} />
      <div className="col gap-1">
        <h1 className="heading">My reflections</h1>
        <p className="body muted">Your own notes on each area. Saved automatically.</p>
        <p className="caption muted">🔒 Private — your teacher can never see these.</p>
      </div>

      {NOTE_SECTIONS.map((s) => (
        <Card key={s.key}>
          <h3 className="heading">{s.label}</h3>
          <textarea
            className="textarea"
            value={drafts[s.key] ?? ''}
            onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
            onBlur={() => persist(s.key)}
            placeholder="How did this area go this week?"
          />
        </Card>
      ))}
    </main>
  );
}
