'use client';
// app/(app)/student/lesson-notes/page.tsx — read-only view of the teacher's weekly notes.
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card, Button, BackButton } from '@/components/ui';
import { prettyDate } from '@/lib/date';
import { NOTE_SECTIONS } from '@/lib/labels';
import { useCurrentLessonWeek } from '@/hooks/queries';
import type { LessonWeek } from '@/types/database';

export default function StudentLessonNotes() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: lessonWeek } = useCurrentLessonWeek(profile?.id);

  return (
    <main className="screen screen--flush">
      <BackButton onClick={() => router.back()} />
      <div className="col gap-1">
        <p className="caption muted">{lessonWeek?.week_start ? prettyDate(lessonWeek.week_start, 'd MMMM yyyy') : 'This week'}</p>
        <h1 className="heading">Your teacher&apos;s notes</h1>
        <p className="body muted">Use your teacher&apos;s notes to set your goals for the week.</p>
      </div>

      {NOTE_SECTIONS.map((s) => {
        const value = (lessonWeek?.[s.key as keyof LessonWeek] as string | null) ?? '';
        const has = value.trim().length > 0;
        return (
          <Card key={s.key}>
            <h3 className="heading">{s.label}</h3>
            {has ? <p className="body">{value}</p> : <p className="body muted">Your teacher hasn&apos;t added notes for this section yet.</p>}
          </Card>
        );
      })}

      <Button title="Write my reflections" variant="secondary" onClick={() => router.push('/student/practice-notes')} block />
    </main>
  );
}
