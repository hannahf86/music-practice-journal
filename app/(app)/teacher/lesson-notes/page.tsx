'use client';
// app/(app)/teacher/lesson-notes/page.tsx — teacher writes/publishes structured weekly notes.
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card, Button, Pill, BackButton } from '@/components/ui';
import { weekRangeLabel, weekStartISO } from '@/lib/date';
import { useCurrentLessonWeek, useSaveLessonNotes } from '@/hooks/queries';

const SECTIONS = [
  { key: 'technical_work' as const, label: 'Technical Work', placeholder: 'Use your notes to set goals for the week. Ask your student to use Practice Tips for help.' },
  { key: 'repertoire' as const, label: 'Repertoire', placeholder: 'Pieces and passages to focus on…' },
  { key: 'sight_reading' as const, label: 'Sight-Reading', placeholder: 'Sight-reading practice for the week…' },
  { key: 'musicianship' as const, label: 'Musicianship', placeholder: 'Scales, aural, theory, listening…' },
];

function TeacherLessonNotesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const studentId = params.get('studentId') ?? undefined;
  const name = params.get('name') ?? '';
  const profile = useAuthStore((s) => s.profile);
  const { data: lessonWeek } = useCurrentLessonWeek(studentId);
  const saveNotes = useSaveLessonNotes();

  const [fields, setFields] = useState<Record<string, string>>({});
  useEffect(() => {
    setFields({
      technical_work: lessonWeek?.technical_work ?? '',
      repertoire: lessonWeek?.repertoire ?? '',
      sight_reading: lessonWeek?.sight_reading ?? '',
      musicianship: lessonWeek?.musicianship ?? '',
    });
  }, [lessonWeek]);

  function save(publish: boolean) {
    if (!studentId || !profile) return;
    saveNotes.mutate(
      {
        student_id: studentId,
        teacher_id: profile.id,
        week_start: lessonWeek?.week_start ?? weekStartISO(),
        technical_work: fields.technical_work?.trim() || null,
        repertoire: fields.repertoire?.trim() || null,
        sight_reading: fields.sight_reading?.trim() || null,
        musicianship: fields.musicianship?.trim() || null,
        published: publish,
      },
      {
        onSuccess: () => window.alert(publish ? 'Published — your student can see these notes now.' : 'Saved as a draft.'),
        onError: (e: unknown) => {
          const msg = e instanceof Error ? e.message : 'Could not save';
          window.alert(msg.includes('policy') ? 'You can only write notes for students actively linked to you.' : msg);
        },
      },
    );
  }

  return (
    <main className="screen screen--flush">
      <BackButton onClick={() => router.back()} />
      <div className="col gap-1">
        <div className="row-between">
          <h1 className="heading">{name || 'Student'}</h1>
          {lessonWeek?.published ? <Pill text="Published" tone="success" /> : lessonWeek ? <Pill text="Draft" tone="warning" /> : null}
        </div>
        <p className="caption">{weekRangeLabel(lessonWeek?.week_start ?? weekStartISO())}</p>
      </div>

      {SECTIONS.map((s) => (
        <Card key={s.key}>
          <h3 className="heading">{s.label}</h3>
          <textarea className="textarea" value={fields[s.key] ?? ''} onChange={(e) => setFields((f) => ({ ...f, [s.key]: e.target.value }))} placeholder={s.placeholder} />
        </Card>
      ))}

      <div className="row gap-3">
        <Button title="Save draft" variant="secondary" onClick={() => save(false)} loading={saveNotes.isPending} block />
        <Button title="Publish" onClick={() => save(true)} loading={saveNotes.isPending} block />
      </div>

      <p className="caption muted" style={{ textAlign: 'center' }}>
        Lesson notes are the only thing you can write. Your student builds their own practice plan from them.
      </p>
    </main>
  );
}

export default function TeacherLessonNotes() {
  return (
    <Suspense fallback={<div className="loader"><div className="spinner" /></div>}>
      <TeacherLessonNotesInner />
    </Suspense>
  );
}
