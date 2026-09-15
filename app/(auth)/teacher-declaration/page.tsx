'use client';
// app/(auth)/teacher-declaration/page.tsx — MU/ISM/DBS form + safeguarding declaration.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { Button, Field, Card } from '@/components/ui';

const COMMITMENTS = [
  'I will safeguard the wellbeing of every student in my care.',
  'I will keep all communication within this app and never message students privately.',
  'I will only record structured lesson notes — never access private reflections.',
  'I hold current professional membership and/or a valid DBS check.',
  'I will report any safeguarding concern to the appropriate authority without delay.',
];

export default function TeacherDeclaration() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const [mu, setMu] = useState('');
  const [ism, setIsm] = useState('');
  const [dbs, setDbs] = useState('');
  const [institution, setInstitution] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasProfessionalId = [mu, ism, dbs].some((v) => v.trim().length > 0);
  const canSubmit = hasProfessionalId && confirmed;

  async function onSubmit() {
    if (!session?.user || !canSubmit) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('teacher_declarations').upsert(
        {
          teacher_id: session.user.id,
          mu_number: mu.trim() || null,
          ism_number: ism.trim() || null,
          dbs_certificate_number: dbs.trim() || null,
          institution_name: institution.trim() || null,
          declaration_confirmed: true,
          signed_at: new Date().toISOString(),
        },
        { onConflict: 'teacher_id' },
      );
      if (error) throw error;
      router.replace('/home');
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Could not submit.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="col gap-1">
        <span className="caption text-primary-c">Before you begin</span>
        <h1 className="title">Professional declaration</h1>
        <p className="body muted">
          To protect students, teachers must provide at least one professional ID and confirm the
          safeguarding declaration before accessing any student data.
        </p>
      </div>

      <Card>
        <h3 className="heading">Professional identification</h3>
        <p className="caption muted">Provide at least one.</p>
        <Field label="MU number (Musicians' Union)" value={mu} onChange={(e) => setMu(e.target.value)} placeholder="e.g. MU123456" />
        <Field label="ISM number" value={ism} onChange={(e) => setIsm(e.target.value)} placeholder="e.g. ISM7890" />
        <Field label="DBS certificate number" value={dbs} onChange={(e) => setDbs(e.target.value)} placeholder="e.g. 001234567890" />
        <Field label="Institution (optional)" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="School or music service" />
      </Card>

      <Card>
        <h3 className="heading">Safeguarding commitments</h3>
        <ul className="col gap-2" style={{ margin: 0, paddingLeft: 'var(--sp-4)' }}>
          {COMMITMENTS.map((c) => (
            <li key={c} className="body muted">
              {c}
            </li>
          ))}
        </ul>
        <label className="row" style={{ cursor: 'pointer', marginTop: 'var(--sp-2)' }}>
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ width: 22, height: 22 }} />
          <span className="body">I confirm the above declaration.</span>
        </label>
      </Card>

      <Button title="Submit declaration" onClick={onSubmit} disabled={!canSubmit} loading={saving} block />

      <p className="caption muted" style={{ textAlign: 'center' }}>
        If a complaint is raised, your union or professional body may be contacted as part of any
        safeguarding review.
      </p>
    </>
  );
}
