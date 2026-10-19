'use client';
// app/(app)/home/page.tsx — "This week" overview. Role-aware: student vs teacher.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/Avatar';
import { Card, Pill, EmptyState, Button } from '@/components/ui';
import { DAYS, DAY_LABELS, todayDayOfWeek, prettyDate, weekRangeLabel, weekStartISO } from '@/lib/date';
import { CATEGORY_LABEL } from '@/lib/labels';
import {
  useCurrentLessonWeek,
  usePracticePlans,
  useWeeklyReview,
  useSaveReview,
  useTeacherRoster,
  useTeacherWeekNotes,
} from '@/hooks/queries';
import type { LessonWeek } from '@/types/database';
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

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const TEACHER_SECTIONS: { key: keyof LessonWeek; label: string }[] = [
  { key: 'technical_work', label: 'Technical Work' },
  { key: 'repertoire', label: 'Repertoire' },
  { key: 'sight_reading', label: 'Sight-Reading' },
  { key: 'musicianship', label: 'Musicianship' },
];

function noteFocus(lw: LessonWeek): string {
  const first = [lw.technical_work, lw.repertoire, lw.sight_reading, lw.musicianship].find((v) => (v ?? '').trim());
  return first?.trim() || 'No details yet';
}

function TeacherHome() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: roster = [] } = useTeacherRoster(profile?.id);
  const { data: notes = [] } = useTeacherWeekNotes(profile?.id);

  const joined = roster.filter((s) => s.account_id).length;
  const published = notes.filter((n) => n.published).length;
  const drafts = notes.length - published;
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const nameFor = useMemo(() => {
    const m = new Map(roster.map((r) => [r.id, r.display_name]));
    return (id: string | null) => (id ? m.get(id) ?? 'Student' : 'Student');
  }, [roster]);

  function copyCode() {
    if (profile?.teacher_code) navigator.clipboard?.writeText(profile.teacher_code).catch(() => {});
  }
  function openNote(n: LessonWeek) {
    router.push(`/teacher/lesson-notes?rosterStudentId=${n.roster_student_id}&name=${encodeURIComponent(nameFor(n.roster_student_id))}`);
  }

  return (
    <main className="dash">
      <div className="dash-topbar">
        <span>Your teaching workspace</span>
        <span>📅 {weekRangeLabel(weekStartISO())} · Current week</span>
      </div>

      <div className="dash-grid">
        {/* ── Main column ── */}
        <div className="col gap-4" style={{ minWidth: 0 }}>
          <div>
            <p className="kicker">{prettyDate(new Date(), 'EEEE d MMMM')}</p>
            <h1 className="greet-title display">
              {greeting()}, {firstName}.
            </h1>
            <p className="body muted">A little structure for a week of musical discovery.</p>
          </div>

          <div className="stat-row">
            <div className="col gap-1">
              <div className="stat">
                <span className="stat-num">{roster.length}</span>
                <span className="caption">My Students</span>
              </div>
              <span className="caption muted">{joined ? `${joined} joined` : 'All not yet joined'}</span>
            </div>
            <div className="stat-div" />
            <div className="col gap-1">
              <div className="stat">
                <span className="stat-num">{notes.length}</span>
                <span className="caption">Notes this week</span>
              </div>
              <span className="caption muted">
                {published} published · {drafts} draft{drafts === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="section-head">
            <h2 className="heading display" style={{ fontSize: 22 }}>
              This week&apos;s lesson notes
            </h2>
            <button className="linkbtn" onClick={() => router.push('/students')}>
              All lesson notes ↗
            </button>
          </div>

          {notes.length === 0 ? (
            <Card>
              <EmptyState emoji="📝" text="No lesson notes this week yet. Add a student, then write their notes." />
              <Button title="+ Add a student" variant="secondary" onClick={() => router.push('/students')} />
            </Card>
          ) : (
            notes.map((n) =>
              n.published ? (
                <button key={n.id} className="note-row" onClick={() => openNote(n)}>
                  <Avatar name={nameFor(n.roster_student_id)} size={34} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="note-name">{nameFor(n.roster_student_id)}</div>
                    <div className="note-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {noteFocus(n)}
                    </div>
                  </div>
                  <Pill text="Published" tone="success" />
                  <span className="muted">›</span>
                </button>
              ) : (
                <div key={n.id} className="note-card">
                  <div className="note-top">
                    <Avatar name={nameFor(n.roster_student_id)} size={38} />
                    <div className="grow">
                      <div className="note-name">{nameFor(n.roster_student_id)}</div>
                      <div className="note-meta">Week of {prettyDate(n.week_start, 'd MMMM')}</div>
                    </div>
                    <Pill text="Draft" tone="warning" />
                  </div>
                  {TEACHER_SECTIONS.map((s) => {
                    const val = ((n[s.key] as string | null) ?? '').trim();
                    if (!val) return null;
                    return (
                      <div key={s.key as string}>
                        <div className="note-sec-label">{s.label}</div>
                        <div className="note-sec-text">{val}</div>
                      </div>
                    );
                  })}
                  <div className="note-foot">
                    <span className="caption muted">Saved {prettyDate(n.updated_at ?? n.week_start, 'd MMM, HH:mm')}</span>
                    <Button title="Continue writing" className="btn-sm" onClick={() => openNote(n)} />
                  </div>
                </div>
              ),
            )
          )}

          <p className="caption muted">
            Notes belong to your roster, even before a student joins. Published notes are saved here;
            student access is coming with linking.
          </p>

          <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
            <span className="text-success">✓</span>
            <p className="caption muted" style={{ margin: 0 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>A safe space for musical growth.</strong>{' '}
              Students&apos; private reflections and practice notes stay private. Your workspace is for lesson
              guidance and shared summaries only.
            </p>
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside className="rail">
          <div className="code-card">
            <div className="row-between">
              <span className="kicker" style={{ color: 'var(--primary)' }}>Your teaching code</span>
              <Pill text="Linking coming soon" tone="primary" />
            </div>
            <div className="row-between">
              <span className="code-value">{profile?.teacher_code ?? '—'}</span>
              <button className="copy-btn" onClick={copyCode}>⧉ Copy</button>
            </div>
            <p className="caption" style={{ color: 'var(--primary-dark)' }}>
              Copy and share for later. Students can&apos;t link with this code yet; you can add their names and
              write lesson notes now.
            </p>
          </div>

          <div className="focus-card">
            <div className="focus-band" />
            <div className="focus-body">
              <span className="kicker" style={{ color: '#b5771a' }}>A focus for this week</span>
              <h3 className="display" style={{ fontSize: 18, color: 'var(--text-primary)' }}>Make the next step small.</h3>
              <p className="caption" style={{ color: 'var(--text-secondary)' }}>
                Choose one achievable goal in each lesson. A clear, repeatable task gives practice a purpose
                between lessons.
              </p>
            </div>
          </div>

          <div className="progress-card">
            <div className="row-between">
              <h3 className="heading display" style={{ fontSize: 18 }}>Progress</h3>
              <Pill text="Coming soon" tone="neutral" />
            </div>
            <div className="row gap-2">
              <span style={{ fontSize: 20 }}>📊</span>
              <span className="body" style={{ fontWeight: 600 }}>No practice data yet</span>
            </div>
            <p className="caption muted">
              Student linking isn&apos;t available yet. Once it&apos;s ready, this space will show shared practice
              summaries.
            </p>
            <p className="caption muted">
              Practice score · Days practised · Self-rating trend. Read-only summaries — never private
              reflections or practice notes.
            </p>
          </div>
        </aside>
      </div>
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
