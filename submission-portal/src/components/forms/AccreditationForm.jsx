import React, { useState } from 'react';
import { FaCertificate } from 'react-icons/fa';
import { supabase } from '../../config/supabase';
import {
  Field, Input, Textarea, Select,
  SectionHeader, FormDivider, Alert, SubmitButton
} from '../FormPrimitives';

const ORG_TYPES = [
  'Academic / Departmental',
  'Socio-Civic',
  'Religious / Spiritual',
  'Cultural / Arts',
  'Sports',
  'Special Interest',
  'Other',
];

const blank = {
  org_name: '', org_acronym: '', org_type: '', year_established: '', mission: '',
  contact_name: '', contact_email: '', contact_number: '',
  adviser_name: '', adviser_email: '',
  notes: '',
};

export default function AccreditationForm({ onSuccess }) {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.org_name.trim()) e.org_name = 'Organization name is required.';
    if (!form.contact_name.trim()) e.contact_name = 'Contact person is required.';
    if (!form.contact_email.trim()) e.contact_email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(form.contact_email)) e.contact_email = 'Enter a valid email address.';
    if (!form.adviser_name.trim()) e.adviser_name = 'Faculty adviser name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');

    try {
      const msg = `[ACCREDITATION APPLICATION]
Org: ${form.org_name}${form.org_acronym ? ` (${form.org_acronym})` : ''}
Type: ${form.org_type || 'Not specified'}
Year Established: ${form.year_established || 'Not specified'}
Mission/Purpose: ${form.mission || 'Not specified'}

Contact: ${form.contact_name} <${form.contact_email}>${form.contact_number ? ` / ${form.contact_number}` : ''}
Faculty Adviser: ${form.adviser_name}${form.adviser_email ? ` <${form.adviser_email}>` : ''}

${form.notes ? `Additional Notes:\n${form.notes}` : ''}`;

      const { error } = await supabase.from('contact_messages').insert({
        first_name: form.contact_name.split(' ')[0] || form.contact_name,
        last_name: form.contact_name.split(' ').slice(1).join(' ') || '',
        email: form.contact_email.trim(),
        student_id: form.org_acronym || '',
        course: 'Accreditation Application',
        message: msg,
        status: 'unread',
      });

      if (error) throw error;
      setSubmitted(true);
      setTimeout(() => onSuccess(), 800);
    } catch (err) {
      console.error(err);
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '2rem 2.5rem' }}>
      {/* Form Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '1.2rem', flexShrink: 0,
        }}>
          <FaCertificate />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Accreditation Application
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Apply for new accreditation or renewal. OSAS will contact you with next steps.
          </p>
        </div>
      </div>

      {serverError && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="error" message={serverError} />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Section 1: Org Info */}
        <SectionHeader number="1" title="Organization Information" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <Field label="Organization Name" required error={errors.org_name}>
              <Input id="acc-org-name" value={form.org_name} onChange={set('org_name')} placeholder="Full organization name" error={errors.org_name} />
            </Field>
            <Field label="Acronym / Short Name">
              <Input id="acc-org-acronym" value={form.org_acronym} onChange={set('org_acronym')} placeholder="e.g., CSS" />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Organization Type">
              <Select id="acc-org-type" value={form.org_type} onChange={set('org_type')}>
                <option value="">Select type...</option>
                {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Year Established" hint="The year the organization was founded">
              <Input id="acc-year-est" type="number" min="1900" max={new Date().getFullYear()} value={form.year_established} onChange={set('year_established')} placeholder="e.g., 2015" />
            </Field>
          </div>
          <Field label="Mission / Purpose">
            <Textarea id="acc-mission" value={form.mission} onChange={set('mission')} placeholder="Brief mission statement or purpose of the organization..." rows={3} />
          </Field>
        </div>

        <FormDivider />

        {/* Section 2: Contact */}
        <SectionHeader number="2" title="Contact Person" />
        <div className="grid-3">
          <Field label="Full Name" required error={errors.contact_name}>
            <Input id="acc-contact-name" value={form.contact_name} onChange={set('contact_name')} placeholder="Juan Dela Cruz" error={errors.contact_name} />
          </Field>
          <Field label="Email Address" required error={errors.contact_email}>
            <Input id="acc-contact-email" type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="juan@email.com" error={errors.contact_email} />
          </Field>
          <Field label="Contact Number">
            <Input id="acc-contact-number" value={form.contact_number} onChange={set('contact_number')} placeholder="09xx-xxx-xxxx" />
          </Field>
        </div>

        <FormDivider />

        {/* Section 3: Adviser */}
        <SectionHeader number="3" title="Faculty Adviser" />
        <div className="grid-2">
          <Field label="Adviser Full Name" required error={errors.adviser_name}>
            <Input id="acc-adviser-name" value={form.adviser_name} onChange={set('adviser_name')} placeholder="Full name of faculty adviser" error={errors.adviser_name} />
          </Field>
          <Field label="Adviser Email">
            <Input id="acc-adviser-email" type="email" value={form.adviser_email} onChange={set('adviser_email')} placeholder="adviser@school.edu" />
          </Field>
        </div>

        <FormDivider />

        {/* Section 4: Notes */}
        <SectionHeader number="4" title="Additional Notes" />
        <Field label="Message to OSAS">
          <Textarea id="acc-notes" value={form.notes} onChange={set('notes')} placeholder="Any additional context, questions, or requirements..." rows={4} />
        </Field>

        {/* Submit row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            OSAS will review your application and contact you via the provided email.
          </p>
          <SubmitButton loading={loading} success={submitted} />
        </div>
      </form>
    </div>
  );
}
