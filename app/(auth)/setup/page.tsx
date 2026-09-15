'use client';
// app/(auth)/setup/page.tsx — role selection + age gate (3 steps).
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { Button, Field, Card } from '@/components/ui';
import { ageFromDOB, normaliseDOB } from '@/lib/age';
import type { UserRole } from '@/types/database';

type Step = 'role' | 'student' | 'parent';

function RoleCard({ emoji, title, description, onClick }: { emoji: string; title: string; description: string; onClick: () => void }) {
  return (
    <Card onClick={onClick}>
      <div className="row">
        <span style={{ fontSize: 28, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', borderRadius: 'var(--r-lg)' }}>
          {emoji}
        </span>
        <div className="grow">
          <h3 className="heading">{title}</h3>
          <p className="caption">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Setup() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [step, setStep] = useState<Step>('role');
  const [saving, setSaving] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentDOB, setStudentDOB] = useState('');
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childDOB, setChildDOB] = useState('');

  async function saveProfile(fields: { role: UserRole; full_name: string; date_of_birth: string | null }) {
    if (!session?.user) {
      window.alert('Not signed in — please sign in again.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        role: fields.role,
        full_name: fields.full_name,
        date_of_birth: fields.date_of_birth,
        teacher_code: fields.role === 'teacher' ? `T-${session.user.id.slice(0, 6).toUpperCase()}` : null,
      });
      if (error) throw error;
      await fetchProfile(session.user.id);
      router.replace(fields.role === 'teacher' ? '/teacher-declaration' : '/home');
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  function onStudentNext() {
    if (!studentName.trim()) return window.alert('Please enter your name.');
    const dob = normaliseDOB(studentDOB);
    if (!dob) return window.alert('Enter your date of birth as DD/MM/YYYY.');
    const age = ageFromDOB(dob);
    if (age == null) return window.alert('That date does not look right.');
    if (age < 13) {
      window.alert(
        'For students under 13, a parent or guardian creates and holds the account. Please ask them to sign up and choose "I\'m a parent".',
      );
      setStep('role');
      return;
    }
    saveProfile({ role: 'student', full_name: studentName.trim(), date_of_birth: dob });
  }

  function onParentNext() {
    if (!parentName.trim() || !childName.trim()) return window.alert('Please enter both names.');
    const dob = normaliseDOB(childDOB);
    if (!dob) return window.alert("Enter the child's date of birth as DD/MM/YYYY.");
    saveProfile({ role: 'parent_proxy', full_name: childName.trim(), date_of_birth: dob });
  }

  return (
    <>
      {step === 'role' && (
        <>
          <div className="col gap-1">
            <span className="caption text-primary-c">Step 1 of 3</span>
            <h1 className="title">Who&apos;s this account for?</h1>
          </div>
          <div className="col gap-3">
            <RoleCard emoji="🎼" title="I'm a teacher" description="Write weekly lesson notes for your students." onClick={() => saveProfile({ role: 'teacher', full_name: '', date_of_birth: null })} />
            <RoleCard emoji="🎻" title="I'm a student" description="Plan your practice and reflect each week." onClick={() => setStep('student')} />
            <RoleCard emoji="👪" title="I'm a parent" description="Set up and follow your child's practice journal." onClick={() => setStep('parent')} />
          </div>
        </>
      )}

      {step === 'student' && (
        <>
          <div className="col gap-1">
            <span className="caption text-primary-c">Step 2 of 3</span>
            <h1 className="title">About you</h1>
            <p className="body muted">We use your age only to keep younger students safe.</p>
          </div>
          <div className="col gap-4">
            <Field label="Your name" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Alex" />
            <Field label="Date of birth" value={studentDOB} onChange={(e) => setStudentDOB(e.target.value)} placeholder="DD/MM/YYYY" inputMode="numeric" />
            <Button title="Continue" onClick={onStudentNext} loading={saving} block />
            <Button title="Back" variant="ghost" onClick={() => setStep('role')} block />
          </div>
        </>
      )}

      {step === 'parent' && (
        <>
          <div className="col gap-1">
            <span className="caption text-primary-c">Step 3 of 3</span>
            <h1 className="title">Your child&apos;s details</h1>
            <p className="body muted">You&apos;ll hold and manage the journal on your child&apos;s behalf.</p>
          </div>
          <div className="col gap-4">
            <Field label="Your name" value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Sam" />
            <Field label="Child's name" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Alex" />
            <Field label="Child's date of birth" value={childDOB} onChange={(e) => setChildDOB(e.target.value)} placeholder="DD/MM/YYYY" inputMode="numeric" />
            <Button title="Finish" onClick={onParentNext} loading={saving} block />
            <Button title="Back" variant="ghost" onClick={() => setStep('role')} block />
          </div>
        </>
      )}
    </>
  );
}
