'use client';
// app/(app)/teacher/student-progress/page.tsx — read-only aggregate progress for one student.
// Sourced from teacher_review_summary — private reflections are never fetched here.
import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart, type BarDatum } from '@/components/BarChart';
import { Card, Pill, EmptyState, BackButton } from '@/components/ui';
import { prettyDate } from '@/lib/date';
import { RATING_LABEL } from '@/lib/labels';
import { useStudentSummary } from '@/hooks/queries';

function TeacherStudentProgressInner() {
  const router = useRouter();
  const params = useSearchParams();
  const studentId = params.get('studentId') ?? undefined;
  const name = params.get('name') ?? '';
  const { data: rows = [] } = useStudentSummary(studentId);

  const chartData: BarDatum[] = useMemo(() => rows.map((r) => ({ week: r.week_number, score: r.practice_score })), [rows]);
  const latestWeek = rows.length ? Math.max(...rows.map((r) => r.week_number)) : undefined;

  return (
    <main className="screen screen--flush">
      <BackButton onClick={() => router.back()} />
      <div className="col gap-1">
        <h1 className="heading">{name || 'Student'}</h1>
        <p className="caption">Aggregate progress only — reflections stay private.</p>
      </div>

      <Card>
        <h3 className="heading">Practice scores</h3>
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <BarChart data={chartData} currentWeek={latestWeek} />
        </div>
      </Card>

      <Card>
        <h3 className="heading">Week by week</h3>
        {rows.length === 0 ? (
          <EmptyState text="No submitted reviews yet." />
        ) : (
          <div className="col gap-2" style={{ marginTop: 'var(--sp-2)' }}>
            {rows
              .slice()
              .sort((a, b) => b.week_number - a.week_number)
              .map((r) => (
                <div key={r.lesson_week_id} className="row-between" style={{ paddingBlock: 'var(--sp-1)' }}>
                  <div>
                    <span className="body" style={{ fontWeight: 600 }}>Week {r.week_number}</span>
                    <p className="caption muted">{prettyDate(r.week_start, 'd MMM')}</p>
                  </div>
                  <div className="row gap-2">
                    <span className="caption">{r.days_practised}/7 days</span>
                    {r.self_rating && <Pill text={RATING_LABEL[r.self_rating]} tone="primary" />}
                    <Pill text={r.practice_score != null ? `${r.practice_score}/10` : '—'} tone="warning" />
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </main>
  );
}

export default function TeacherStudentProgress() {
  return (
    <Suspense fallback={<div className="loader"><div className="spinner" /></div>}>
      <TeacherStudentProgressInner />
    </Suspense>
  );
}
