'use client';
// app/(app)/student/concerts/page.tsx — concert & exam dates with countdowns; past archived below.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card, Button, Field, Pill, Sheet, EmptyState, Divider, BackButton } from '@/components/ui';
import { prettyDate, daysUntil } from '@/lib/date';
import { normaliseDOB } from '@/lib/age';
import { useConcerts, useAddConcert } from '@/hooks/queries';

export default function Concerts() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const studentId = profile?.id;
  const { data: concerts = [] } = useConcerts(studentId);
  const addConcert = useAddConcert();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [memorise, setMemorise] = useState('');
  const [pieces, setPieces] = useState('');

  const upcoming = concerts.filter((c) => daysUntil(c.due_date) >= 0);
  const past = concerts.filter((c) => daysUntil(c.due_date) < 0);

  function save() {
    if (!studentId || !title.trim()) return window.alert('Name the concert or exam.');
    const dueIso = normaliseDOB(due);
    if (!dueIso) return window.alert('Enter the due date as DD/MM/YYYY.');
    addConcert.mutate(
      {
        student_id: studentId,
        title: title.trim(),
        due_date: dueIso,
        memorise_by: memorise.trim() ? normaliseDOB(memorise) : null,
        pieces: pieces.split(',').map((p) => p.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          setTitle('');
          setDue('');
          setMemorise('');
          setPieces('');
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
        <h1 className="title">Concerts &amp; exams</h1>
        <Button title="+ Add" variant="secondary" className="btn-sm" onClick={() => setAdding(true)} />
      </div>

      {concerts.length === 0 && <EmptyState emoji="🎫" text="Add a concert or exam to count down to." />}

      {upcoming.map((c) => {
        const d = daysUntil(c.due_date);
        return (
          <Card key={c.id}>
            <div className="row-between">
              <h3 className="heading grow">{c.title}</h3>
              <Pill text={d === 0 ? 'Today' : `${d} day${d === 1 ? '' : 's'}`} tone={d <= 7 ? 'warning' : 'primary'} />
            </div>
            <p className="caption">Due {prettyDate(c.due_date, 'EEEE d MMMM')}</p>
            {c.memorise_by && <p className="caption muted">Memorise by {prettyDate(c.memorise_by, 'd MMM')}</p>}
            {c.pieces.length > 0 && (
              <div className="row wrap gap-1" style={{ marginTop: 'var(--sp-1)' }}>
                {c.pieces.map((p) => (
                  <Pill key={p} text={p} tone="neutral" />
                ))}
              </div>
            )}
          </Card>
        );
      })}

      {past.length > 0 && (
        <div className="col gap-3" style={{ marginTop: 'var(--sp-3)' }}>
          <Divider />
          <span className="caption muted">Past events</span>
          {past.map((c) => (
            <Card key={c.id} className="" >
              <h3 className="heading">{c.title}</h3>
              <p className="caption muted">{prettyDate(c.due_date, 'd MMM yyyy')}</p>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)}>
        <h3 className="heading">New concert or exam</h3>
        <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grade 5 Piano" autoFocus />
        <Field label="Due date" value={due} onChange={(e) => setDue(e.target.value)} placeholder="DD/MM/YYYY" inputMode="numeric" />
        <Field label="Memorise by (optional)" value={memorise} onChange={(e) => setMemorise(e.target.value)} placeholder="DD/MM/YYYY" inputMode="numeric" />
        <Field label="Pieces (comma-separated)" value={pieces} onChange={(e) => setPieces(e.target.value)} placeholder="Sonatina, Study No. 3" />
        <Button title="Save" onClick={save} loading={addConcert.isPending} block />
        <Button title="Cancel" variant="ghost" onClick={() => setAdding(false)} block />
      </Sheet>
    </main>
  );
}
