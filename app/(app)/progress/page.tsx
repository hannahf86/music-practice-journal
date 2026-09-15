'use client';
// app/(app)/progress/page.tsx — term progress. Student: charts/goals/countdowns. Teacher: chooser.
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/Avatar';
import { BarChart, type BarDatum } from '@/components/BarChart';
import { Card, Pill, EmptyState, Divider } from '@/components/ui';
import { TERM_WEEKS, daysUntil, prettyDate } from '@/lib/date';
import { useStudentReviews, useGoals, useConcerts, useTeacherStudents, useCurrentLessonWeek } from '@/hooks/queries';

export default function Progress() {
  const profile = useAuthStore((s) => s.profile);
  if (profile?.role === 'teacher') return <TeacherProgress teacherId={profile.id} />;
  return <StudentProgress studentId={profile?.id} />;
}

function StudentProgress({ studentId }: { studentId?: string }) {
  const { data: reviews = [] } = useStudentReviews(studentId);
  const { data: goals = [] } = useGoals(studentId);
  const { data: concerts = [] } = useConcerts(studentId);
  const { data: currentWeek } = useCurrentLessonWeek(studentId);

  const chartData: BarDatum[] = useMemo(() => reviews.map((r) => ({ week: r.week_number, score: r.practice_score })), [reviews]);
  const weekNotes = reviews.filter((r) => (r.general_notes ?? '').trim().length > 0).sort((a, b) => b.week_number - a.week_number);
  const upcoming = concerts.filter((c) => daysUntil(c.due_date) >= 0);
  const activeGoals = goals.filter((g) => !g.achieved);

  return (
    <main className="screen">
      <div className="col gap-1">
        <h1 className="title">Progress</h1>
        <p className="caption">Term overview · {TERM_WEEKS} weeks</p>
      </div>

      <Card>
        <h3 className="heading">Practice scores</h3>
        <p className="caption">Consistency matters more than any single week.</p>
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <BarChart data={chartData} currentWeek={currentWeek?.week_number} />
        </div>
      </Card>

      <Card>
        <h3 className="heading">Long-term goals</h3>
        {activeGoals.length === 0 ? (
          <p className="body muted">No active goals yet — add some from the Goals screen.</p>
        ) : (
          <div className="col gap-3" style={{ marginTop: 'var(--sp-2)' }}>
            {activeGoals.map((g) => (
              <div key={g.id} className="col gap-1">
                <div className="row-between">
                  <span className="body grow">{g.title}</span>
                  {g.target_date && <span className="caption muted">{prettyDate(g.target_date, 'd MMM')}</span>}
                </div>
                <ProgressBar pct={goalProgress(g.created_at, g.target_date)} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="heading">Concerts &amp; exams</h3>
        {upcoming.length === 0 ? (
          <p className="body muted">Nothing coming up.</p>
        ) : (
          <div className="col gap-2" style={{ marginTop: 'var(--sp-2)' }}>
            {upcoming.map((c) => {
              const d = daysUntil(c.due_date);
              return (
                <div key={c.id} className="row-between">
                  <div>
                    <span className="body">{c.title}</span>
                    <p className="caption muted">{prettyDate(c.due_date, 'EEE d MMM')}</p>
                  </div>
                  <Pill text={d === 0 ? 'Today' : `${d} day${d === 1 ? '' : 's'}`} tone={d <= 7 ? 'warning' : 'primary'} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="heading">Week-by-week notes</h3>
        {weekNotes.length === 0 ? (
          <p className="body muted">Your weekly review comments will appear here.</p>
        ) : (
          <div className="col gap-3" style={{ marginTop: 'var(--sp-2)' }}>
            {weekNotes.map((r, i) => (
              <div key={r.id}>
                {i > 0 && <Divider />}
                <div style={{ paddingTop: i > 0 ? 'var(--sp-3)' : 0 }}>
                  <span className="caption text-primary-c" style={{ fontWeight: 600 }}>Week {r.week_number}</span>
                  <p className="body muted">{r.general_notes}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}

function TeacherProgress({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const { data: students = [] } = useTeacherStudents(teacherId);
  const active = students.filter((s) => s.link.status === 'active');

  return (
    <main className="screen">
      <div className="col gap-1">
        <h1 className="title">Progress</h1>
        <p className="caption">Choose a student to view their term progress.</p>
      </div>
      {active.length === 0 ? (
        <EmptyState emoji="📈" text="Once students are linked, their progress appears here." />
      ) : (
        active.map((s) => (
          <Card key={s.link.id} onClick={() => router.push(`/teacher/student-progress?studentId=${s.link.student_id}&name=${encodeURIComponent(s.profile?.full_name ?? '')}`)}>
            <div className="row">
              <Avatar name={s.profile?.full_name} />
              <div className="grow">
                <h3 className="heading">{s.profile?.full_name || 'Student'}</h3>
                <p className="caption">This week: {s.summary?.practice_score != null ? `${s.summary.practice_score}/10` : '—'}</p>
              </div>
              <span className="caption text-primary-c">View ›</span>
            </div>
          </Card>
        ))
      )}
    </main>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 8, borderRadius: 'var(--r-full)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(4, pct))}%`, background: 'var(--primary)' }} />
    </div>
  );
}

function goalProgress(createdAt: string, targetDate: string | null): number {
  if (!targetDate) return 8;
  const start = new Date(createdAt).getTime();
  const end = new Date(targetDate).getTime();
  if (end <= start) return 100;
  return Math.round(((Date.now() - start) / (end - start)) * 100);
}
