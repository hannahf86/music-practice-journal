'use client';
// app/(app)/student/goals/page.tsx — long-term goals with achieved toggle + celebration.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card, Button, Field, Sheet, EmptyState, BackButton } from '@/components/ui';
import { prettyDate } from '@/lib/date';
import { normaliseDOB } from '@/lib/age';
import { useGoals, useAddGoal, useToggleGoal } from '@/hooks/queries';

export default function Goals() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const studentId = profile?.id;
  const { data: goals = [] } = useGoals(studentId);
  const addGoal = useAddGoal();
  const toggleGoal = useToggleGoal();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const active = goals.filter((g) => !g.achieved);
  const achieved = goals.filter((g) => g.achieved);

  function save() {
    if (!studentId || !title.trim()) return window.alert('Give your goal a name.');
    addGoal.mutate(
      { student_id: studentId, title: title.trim(), target_date: target.trim() ? normaliseDOB(target) : null },
      {
        onSuccess: () => {
          setTitle('');
          setTarget('');
          setAdding(false);
        },
        onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not add'),
      },
    );
  }

  return (
    <main className="screen screen--flush">
      <BackButton onClick={() => router.back()} />
      <div className="row-between">
        <h1 className="title">Goals</h1>
        <Button title="+ Add" variant="secondary" className="btn-sm" onClick={() => setAdding(true)} />
      </div>

      {goals.length === 0 && <EmptyState emoji="🎯" text="Set a long-term goal — something to aim for beyond this week." />}

      {active.map((g) => (
        <Card key={g.id}>
          <div className="row">
            <button onClick={() => toggleGoal.mutate({ id: g.id, achieved: true })} aria-label="Mark achieved" style={checkbox} />
            <div className="grow">
              <h3 className="heading">{g.title}</h3>
              {g.target_date && <p className="caption muted">Target: {prettyDate(g.target_date, 'd MMM yyyy')}</p>}
            </div>
          </div>
        </Card>
      ))}

      {achieved.length > 0 && (
        <div className="col gap-3" style={{ marginTop: 'var(--sp-3)' }}>
          <span className="caption text-success">🎉 Achieved</span>
          {achieved.map((g) => (
            <Card key={g.id} variant="success">
              <div className="row">
                <button onClick={() => toggleGoal.mutate({ id: g.id, achieved: false })} style={{ ...checkbox, background: 'var(--success)', borderColor: 'var(--success)', color: '#fff' }}>
                  ✓
                </button>
                <div className="grow">
                  <h3 className="heading text-success">{g.title}</h3>
                  {g.achieved_at && <p className="caption text-success">Done {prettyDate(g.achieved_at, 'd MMM')}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)}>
        <h3 className="heading">New goal</h3>
        <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Play Clair de Lune from memory" autoFocus />
        <Field label="Target date (optional)" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="DD/MM/YYYY" inputMode="numeric" />
        <Button title="Save goal" onClick={save} loading={addGoal.isPending} block />
        <Button title="Cancel" variant="ghost" onClick={() => setAdding(false)} block />
      </Sheet>
    </main>
  );
}

const checkbox: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 'var(--r-full)',
  border: '2px solid var(--border)',
  background: 'transparent',
  cursor: 'pointer',
  flexShrink: 0,
};
