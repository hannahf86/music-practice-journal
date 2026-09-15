'use client';
// app/(app)/students/page.tsx — teacher's student list (aggregate data only).
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/Avatar';
import { Card, Button, Pill, EmptyState } from '@/components/ui';
import { prettyDate } from '@/lib/date';
import { RATING_LABEL } from '@/lib/labels';
import { useTeacherStudents, useAcceptLink } from '@/hooks/queries';

export default function Students() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: students = [], isLoading } = useTeacherStudents(profile?.id);
  const acceptLink = useAcceptLink();

  const active = students.filter((s) => s.link.status === 'active');
  const pending = students.filter((s) => s.link.status === 'pending');

  return (
    <main className="screen">
      <div className="col gap-1">
        <h1 className="title">My students</h1>
        <p className="caption">Aggregate data only — private reflections stay private.</p>
      </div>

      {!isLoading && students.length === 0 && (
        <Card>
          <EmptyState emoji="🎓" text="No students linked yet — share your teacher code so they can connect." />
          <div style={{ textAlign: 'center', background: 'var(--primary-light)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)' }}>
            <p className="caption text-primary-c">Your code</p>
            <h3 className="heading text-primary-c">{profile?.teacher_code ?? '—'}</h3>
          </div>
        </Card>
      )}

      {pending.length > 0 && (
        <div className="col gap-2">
          <span className="caption" style={{ fontWeight: 600 }}>Pending requests</span>
          {pending.map((s) => (
            <Card key={s.link.id}>
              <div className="row">
                <Avatar name={s.profile?.full_name} />
                <div className="grow">
                  <h3 className="heading">{s.profile?.full_name || 'Student'}</h3>
                  <Pill text="Pending" tone="warning" />
                </div>
                <Button
                  title="Accept"
                  variant="secondary"
                  onClick={() =>
                    acceptLink.mutate(s.link.id, {
                      onError: (e: unknown) => {
                        const msg = e instanceof Error ? e.message : 'Could not accept';
                        window.alert(msg.includes('policy') ? 'Complete your professional declaration before accepting students.' : msg);
                      },
                    })
                  }
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {active.map((s) => {
        const sum = s.summary;
        return (
          <Card key={s.link.id} onClick={() => router.push(`/teacher/lesson-notes?studentId=${s.link.student_id}&name=${encodeURIComponent(s.profile?.full_name ?? '')}`)}>
            <div className="row">
              <Avatar name={s.profile?.full_name} />
              <div className="grow">
                <h3 className="heading">{s.profile?.full_name || 'Student'}</h3>
                <p className="caption muted">Last lesson {sum?.week_start ? prettyDate(sum.week_start, 'd MMM') : '—'}</p>
              </div>
              <Pill text="Active" tone="success" />
            </div>
            <div className="row gap-3">
              <Stat label="Score" value={sum?.practice_score != null ? `${sum.practice_score}/10` : '—'} />
              <Stat label="Days" value={sum?.days_practised != null ? `${sum.days_practised}/7` : '—'} />
              <Stat label="Rating" value={sum?.self_rating ? RATING_LABEL[sum.self_rating] : '—'} />
            </div>
          </Card>
        );
      })}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grow" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)' }}>
      <p className="caption muted">{label}</p>
      <span className="body" style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}
