'use client';
// app/(app)/(tabs)/students/page.tsx — teacher roster. Add students by name (no account needed);
// a student later claims their entry with the teacher's code.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/Avatar';
import { Card, Button, Field, Pill, Sheet, EmptyState } from '@/components/ui';
import { useTeacherRoster, useAddRosterStudent } from '@/hooks/queries';

export default function Students() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: roster = [], isLoading } = useTeacherRoster(profile?.id);
  const addStudent = useAddRosterStudent();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function save() {
    if (!profile?.id || !name.trim()) return window.alert("Enter the student's name.");
    addStudent.mutate(
      { teacher_id: profile.id, display_name: name.trim() },
      {
        onSuccess: () => {
          setName('');
          setAdding(false);
        },
        onError: (e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not add student'),
      },
    );
  }

  return (
    <main className="screen">
      <div className="row-between">
        <div className="col gap-1">
          <h1 className="title">My students</h1>
          <p className="caption">Add students by name, then write their weekly lesson notes.</p>
        </div>
        <Button title="+ Add" variant="secondary" className="btn-sm" onClick={() => setAdding(true)} />
      </div>

      {!isLoading && roster.length === 0 && (
        <Card>
          <EmptyState emoji="🎓" text="No students yet. Add your first student to start writing lesson notes." />
          <div style={{ textAlign: 'center', background: 'var(--primary-light)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)' }}>
            <p className="caption text-primary-c">Your code (students enter this to connect)</p>
            <h3 className="heading text-primary-c">{profile?.teacher_code ?? '—'}</h3>
          </div>
        </Card>
      )}

      {roster.map((s) => (
        <Card
          key={s.id}
          onClick={() =>
            router.push(`/teacher/lesson-notes?rosterStudentId=${s.id}&name=${encodeURIComponent(s.display_name)}`)
          }
        >
          <div className="row">
            <Avatar name={s.display_name} />
            <div className="grow">
              <h3 className="heading">{s.display_name}</h3>
              <p className="caption muted">Tap to write lesson notes</p>
            </div>
            {s.account_id ? <Pill text="Linked" tone="success" /> : <Pill text="Not yet joined" tone="neutral" />}
          </div>
        </Card>
      ))}

      {roster.length > 0 && (
        <p className="caption muted" style={{ textAlign: 'center' }}>
          Share your code <strong className="text-primary-c">{profile?.teacher_code ?? '—'}</strong> so students can
          connect their own account.
        </p>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)}>
        <h3 className="heading">Add a student</h3>
        <Field
          label="Student name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex Taylor"
          autoFocus
        />
        <Button title="Add student" onClick={save} loading={addStudent.isPending} block />
        <Button title="Cancel" variant="ghost" onClick={() => setAdding(false)} block />
      </Sheet>
    </main>
  );
}
