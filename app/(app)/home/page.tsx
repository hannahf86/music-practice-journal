'use client';
// app/(app)/home/page.tsx — "This week" overview. Role-aware: student vs teacher.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/Avatar';
import { Card, Pill, EmptyState } from '@/components/ui';
import { DAYS, DAY_LABELS, todayDayOfWeek, prettyDate } from '@/lib/date';
import { CATEGORY_LABEL } from '@/lib/labels';
import {
  useCurrentLessonWeek,
  usePracticePlans,
  useWeeklyReview,
  useSaveReview,
  useTeacherRoster,
} from '@/hooks/queries';
import type { Mood } from '@/types/database';

const MOODS: { value: Mood; emoji: string }[] = [
  { value: 'tired', emoji: '😴' },
  { value: 'meh', emoji: '😕' },
  { value: 'good', emoji: '😊' },
  { value: 'great', emoji: '🤩' },
];

function signOut() {
  if (window.confirm('Sign out?')) useAuthStore.getState().signOut();
}

export default function Home() {
  const profile = useAuthStore((s) => s.profile);
  if (profile?.role === 'teacher') return <TeacherHome />;
  return <StudentHome />;
}

function StudentHome() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const studentId = profile?.id;
  const today = todayDayOfWeek();

  const { data: lessonWeek } = useCurrentLessonWeek(studentId);
  const { data: plans = [] } = usePracticePlans(lessonWeek?.id);
  const { data: review } = useWeeklyReview(lessonWeek?.id);
  const saveReview = useSaveReview();
  const [mood, setMood] = useState<Mood | null>(review?.mood ?? null);

  const practisedDays = useMemo(
    () => new Set(plans.filter((p) => p.completed).map((p) => p.day)),
    [plans],
  );
  const todaysCells = plans.filter((p) => p.day === today);
  const lessonHasNotes =
    !!lessonWeek &&
    [lessonWeek.technical_work, lessonWeek.repertoire, lessonWeek.sight_reading, lessonWeek.musicianship].some(
      (s) => (s ?? '').trim().length > 0,
    );

  function pickMood(m: Mood) {
    setMood(m);
    if (lessonWeek && studentId) saveReview.mutate({ student_id: studentId, lesson_week_id: lessonWeek.id, mood: m });
  }

  return (
    <main className="screen">
      <div className="screen-header">
        <div>
          <p className="caption muted">{prettyDate(new Date(), 'EEEE d MMMM')}</p>
          <h1 className="title">Hi {profile?.full_name?.split(' ')[0] || 'there'}</h1>
        </div>
        <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Sign out">
          <Avatar name={profile?.full_name} size={48} />
        </button>
      </div>

      <Card>
        <p className="caption">This week</p>
        <div className="row-between" style={{ marginTop: 'var(--sp-2)' }}>
          {DAYS.map((d) => {
            const practised = practisedDays.has(d);
            const isToday = d === today;
            return (
              <div key={d} className="col" style={{ alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 'var(--r-full)',
                    background: practised ? 'var(--primary)' : 'transparent',
                    border: `2px solid ${isToday ? 'var(--accent)' : practised ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                />
                <span className="caption" style={{ color: isToday ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  {DAY_LABELS[d]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card onClick={() => router.push('/student/lesson-notes')}>
        <div className="row-between">
          <h3 className="heading">This week&apos;s lesson</h3>
          <span className="caption text-primary-c">View ›</span>
        </div>
        {lessonHasNotes ? (
          <p className="body muted" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {lessonWeek?.technical_work || lessonWeek?.repertoire || lessonWeek?.sight_reading || lessonWeek?.musicianship}
          </p>
        ) : (
          <p className="body muted">Your teacher will add notes after your next lesson.</p>
        )}
      </Card>

      <Card>
        <h3 className="heading">Today&apos;s practice</h3>
        {todaysCells.length === 0 ? (
          <p className="body muted">Nothing planned for today yet — build your plan from your lesson notes.</p>
        ) : (
          <div className="col gap-2">
            {todaysCells.map((c) => (
              <div key={c.id} className="row" style={{ alignItems: 'flex-start' }}>
                <Pill text={CATEGORY_LABEL[c.category]} tone="primary" />
                <span className="body grow" style={{ textDecoration: c.completed ? 'line-through' : 'none', color: c.completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                  {c.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="row gap-3">
        <QuickLink emoji="🎯" label="Goals" onClick={() => router.push('/student/goals')} />
        <QuickLink emoji="🎫" label="Concerts" onClick={() => router.push('/student/concerts')} />
        <QuickLink emoji="🎼" label="Teacher" onClick={() => window.alert('Ask your teacher for their code, then connect here to receive weekly lesson notes.')} />
      </div>

      <Card>
        <h3 className="heading">How are you feeling about practice?</h3>
        <p className="caption">Noticing a tough day helps you practise more kindly — and more consistently.</p>
        <div className="row-between" style={{ marginTop: 'var(--sp-2)' }}>
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => pickMood(m.value)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--r-full)',
                fontSize: 28,
                cursor: 'pointer',
                background: mood === m.value ? 'var(--primary-light)' : 'var(--bg-secondary)',
                border: `2px solid ${mood === m.value ? 'var(--primary)' : 'transparent'}`,
              }}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </Card>

      {!lessonWeek && <EmptyState emoji="🎵" text="Once your teacher adds a lesson week, your journal comes to life here." />}
    </main>
  );
}

function TeacherHome() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: roster = [] } = useTeacherRoster(profile?.id);
  const joined = roster.filter((s) => s.account_id).length;

  return (
    <main className="screen">
      <div className="screen-header">
        <div>
          <p className="caption muted">{prettyDate(new Date(), 'EEEE d MMMM')}</p>
          <h1 className="title">Hello{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
        </div>
        <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Sign out">
          <Avatar name={profile?.full_name || 'T'} size={48} />
        </button>
      </div>

      <Card>
        <h3 className="heading">Your teaching code</h3>
        <p className="body muted">Share this with students so they can link to you.</p>
        <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', textAlign: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', letterSpacing: 2 }}>{profile?.teacher_code ?? '—'}</span>
        </div>
      </Card>

      <Card onClick={() => router.push('/students')}>
        <div className="row-between">
          <div>
            <h3 className="heading">Your students</h3>
            <p className="caption">
              {roster.length} student{roster.length === 1 ? '' : 's'}
              {joined ? ` · ${joined} joined` : ''}
            </p>
          </div>
          <span className="caption text-primary-c">Open ›</span>
        </div>
      </Card>

      <Card>
        <h3 className="heading">This week</h3>
        <p className="body muted">
          Add lesson notes for each student after their lesson. Keep guidance structured — students
          build their own practice plan from what you write.
        </p>
      </Card>
    </main>
  );
}

function QuickLink({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button className="card card--pressable grow" onClick={onClick} style={{ alignItems: 'center', gap: 4, paddingTop: 'var(--sp-4)', paddingBottom: 'var(--sp-4)' }}>
      <span style={{ fontSize: 26 }}>{emoji}</span>
      <span className="caption">{label}</span>
    </button>
  );
}
