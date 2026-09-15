'use client';
// app/(app)/review/page.tsx — weekly review + guided reflection. Locks on submit.
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Card, Button, Textarea } from '@/components/ui';
import { weekRangeLabel, weekStartISO } from '@/lib/date';
import { useCurrentLessonWeek, useEnsureCurrentWeek, useWeeklyGoal, useWeeklyReview, useSaveReview } from '@/hooks/queries';
import type { SelfRating } from '@/types/database';

const RATINGS: { value: SelfRating; label: string }[] = [
  { value: 'not_my_best', label: 'Not my best' },
  { value: 'i_did_well', label: 'I did well' },
  { value: 'smashed_it', label: 'Smashed it!' },
];

export default function Review() {
  const profile = useAuthStore((s) => s.profile);
  const studentId = profile?.id;

  const { data: lessonWeek } = useCurrentLessonWeek(studentId);
  const ensureWeek = useEnsureCurrentWeek();
  const { data: goal } = useWeeklyGoal(lessonWeek?.id);
  const { data: review } = useWeeklyReview(lessonWeek?.id);
  const saveReview = useSaveReview();

  useEffect(() => {
    if (studentId && !lessonWeek) ensureWeek.mutate(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, lessonWeek]);

  const [didWell, setDidWell] = useState('');
  const [improvements, setImprovements] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [days, setDays] = useState(0);
  const [rating, setRating] = useState<SelfRating | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!review) return;
    setDidWell(review.did_well ?? '');
    setImprovements(review.improvements ?? '');
    setGeneralNotes(review.general_notes ?? '');
    setDays(review.days_practised ?? 0);
    setRating(review.self_rating ?? null);
    setScore(review.practice_score ?? null);
  }, [review]);

  const locked = review?.submitted === true;

  function submit() {
    if (!studentId || !lessonWeek) return;
    if (!window.confirm("Submit review? Once submitted, this week's review is locked.")) return;
    saveReview.mutate(
      {
        student_id: studentId,
        lesson_week_id: lessonWeek.id,
        did_well: didWell.trim() || null,
        improvements: improvements.trim() || null,
        general_notes: generalNotes.trim() || null,
        days_practised: days,
        self_rating: rating,
        practice_score: score,
        submitted: true,
        submitted_at: new Date().toISOString(),
      },
      { onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not submit') },
    );
  }

  return (
    <main className="screen">
      <div className="col gap-1">
        <h1 className="title">Weekly review</h1>
        <p className="caption">{weekRangeLabel(lessonWeek?.week_start ?? weekStartISO())}</p>
      </div>

      {locked && (
        <Card variant="success">
          <span className="body text-success">✓ Submitted — this review is locked. Nice work reflecting.</span>
        </Card>
      )}

      <Card variant="accent">
        <span className="caption text-primary-c">This week&apos;s goal</span>
        <span className="body">{goal?.goal_text ?? 'Set a goal from your lesson notes to focus your week.'}</span>
      </Card>

      <Card>
        <h3 className="heading">What did I do well?</h3>
        <textarea className="textarea" value={didWell} onChange={(e) => setDidWell(e.target.value)} disabled={locked} placeholder="Celebrate a win, however small…" />
      </Card>
      <Card>
        <h3 className="heading">How could I be more efficient next time?</h3>
        <textarea className="textarea" value={improvements} onChange={(e) => setImprovements(e.target.value)} disabled={locked} placeholder="One thing to try differently…" />
      </Card>
      <Card>
        <h3 className="heading">Comments about my practice</h3>
        <textarea className="textarea" value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} disabled={locked} placeholder="Anything else on your mind…" />
      </Card>

      <p className="caption muted">🔒 Your reflections above are private — your teacher never sees them.</p>

      <Card>
        <h3 className="heading">Days practised</h3>
        <div className="row-between" style={{ marginTop: 'var(--sp-2)' }}>
          {Array.from({ length: 8 }, (_, i) => i).map((n) => (
            <button
              key={n}
              disabled={locked}
              onClick={() => setDays(n)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--r-full)',
                cursor: locked ? 'default' : 'pointer',
                background: n <= days && days > 0 ? 'var(--primary)' : 'var(--bg-secondary)',
                color: n <= days && days > 0 ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: days === n ? '2px solid var(--primary-dark)' : '2px solid transparent',
                fontSize: 13,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="heading">How do you rate this week?</h3>
        <div className="col gap-2" style={{ marginTop: 'var(--sp-2)' }}>
          {RATINGS.map((r) => {
            const selected = rating === r.value;
            return (
              <button
                key={r.value}
                disabled={locked}
                onClick={() => setRating(r.value)}
                className="row-between"
                style={{
                  border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                  background: selected ? 'var(--primary-light)' : 'var(--bg)',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-3)',
                  cursor: locked ? 'default' : 'pointer',
                }}
              >
                <span className="body" style={{ color: selected ? 'var(--primary)' : 'var(--text-primary)' }}>{r.label}</span>
                {selected && <span className="text-primary-c">✓</span>}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="heading">Practice score</h3>
        <p className="caption">Same 1–10 scale as your paper journal.</p>
        <div className="row wrap gap-2" style={{ marginTop: 'var(--sp-2)' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const selected = score === n;
            return (
              <button
                key={n}
                disabled={locked}
                onClick={() => setScore(n)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--r-md)',
                  cursor: locked ? 'default' : 'pointer',
                  background: selected ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: selected ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: 'none',
                  fontWeight: 700,
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </Card>

      {!locked && <Button title="Submit review" onClick={submit} loading={saveReview.isPending} block />}
    </main>
  );
}
