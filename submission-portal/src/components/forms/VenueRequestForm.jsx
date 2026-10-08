import React, { useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { supabase } from '../../config/supabase';
import {
  Field, Input, Textarea, Select,
  SectionHeader, FormDivider, Alert, SubmitButton
} from '../FormPrimitives';

const VENUES = [
  'AVR (Audio Visual Room)',
  'Covered Court',
  'Open Grounds',
  'Function Hall',
  'Gymnasium',
  'Library Conference Room',
  'Campus Chapel',
  'Other (specify in notes)',
];

const blank = {
  org_name: '', org_acronym: '', contact_name: '', contact_email: '', contact_number: '',
  title: '', description: '', event_date: '', event_time_start: '', event_time_end: '',
  venue: '', expected_attendees: '', notes: '',
};

export default function VenueRequestForm({ onSuccess }) {
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
    if (!form.title.trim()) e.title = 'Activity title is required.';
    if (!form.event_date) e.event_date = 'Date is required.';
    if (!form.venue) e.venue = 'Please select a venue.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');

    try {
      const msg = `[VENUE REQUEST]
Org: ${form.org_name}${form.org_acronym ? ` (${form.org_acronym})` : ''}
Activity: ${form.title}
Venue: ${form.venue}
Date: ${form.event_date}${form.event_time_start ? `\nTime: ${form.event_time_start} – ${form.event_time_end}` : ''}
Expected Attendees: ${form.expected_attendees || 'N/A'}
Description: ${form.description || 'N/A'}

${form.notes ? `Notes: ${form.notes}` : ''}`;

      const { error } = await supabase.from('contact_messages').insert({
        first_name: form.contact_name.split(' ')[0] || form.contact_name,
        last_name: form.contact_name.split(' ').slice(1).join(' ') || '',
        email: form.contact_email.trim(),
        student_id: form.org_acronym || '',
        course: 'Venue Request',
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
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '1.2rem', flexShrink: 0,
        }}>
          <FaMapMarkerAlt />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Venue Request
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Request a campus venue for your organization. Our team will contact you to confirm availability.
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
        <div className="grid-2">
          <Field label="Organization Name" required error={errors.org_name}>
            <Input id="vr-org-name" value={form.org_name} onChange={set('org_name')} placeholder="e.g., Computer Science Society" error={errors.org_name} />
          </Field>
          <Field label="Acronym / Short Name">
            <Input id="vr-org-acronym" value={form.org_acronym} onChange={set('org_acronym')} placeholder="e.g., CSS" />
          </Field>
        </div>

        <FormDivider />

        {/* Section 2: Contact */}
        <SectionHeader number="2" title="Contact Person" />
        <div className="grid-3">
          <Field label="Full Name" required error={errors.contact_name}>
            <Input id="vr-contact-name" value={form.contact_name} onChange={set('contact_name')} placeholder="Juan Dela Cruz" error={errors.contact_name} />
          </Field>
          <Field label="Email Address" required error={errors.contact_email}>
            <Input id="vr-contact-email" type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="juan@email.com" error={errors.contact_email} />
          </Field>
          <Field label="Contact Number">
            <Input id="vr-contact-number" value={form.contact_number} onChange={set('contact_number')} placeholder="09xx-xxx-xxxx" />
          </Field>
        </div>

        <FormDivider />

        {/* Section 3: Venue Details */}
        <SectionHeader number="3" title="Venue Request Details" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Activity Title" required error={errors.title}>
            <Input id="vr-title" value={form.title} onChange={set('title')} placeholder="Enter the activity/event title" error={errors.title} />
          </Field>
          <Field label="Description / Purpose">
            <Textarea id="vr-description" value={form.description} onChange={set('description')} placeholder="Brief description of the activity..." rows={3} />
          </Field>
          <div className="grid-3">
            <Field label="Preferred Date" required error={errors.event_date}>
              <Input id="vr-date" type="date" value={form.event_date} onChange={set('event_date')} min={new Date().toISOString().split('T')[0]} error={errors.event_date} />
            </Field>
            <Field label="Start Time">
              <Input id="vr-time-start" type="time" value={form.event_time_start} onChange={set('event_time_start')} />
            </Field>
            <Field label="End Time">
              <Input id="vr-time-end" type="time" value={form.event_time_end} onChange={set('event_time_end')} />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Preferred Venue" required error={errors.venue}>
              <Select id="vr-venue" value={form.venue} onChange={set('venue')} error={errors.venue}>
                <option value="">Select a venue...</option>
                {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Expected Attendees">
              <Input id="vr-attendees" type="number" min="1" value={form.expected_attendees} onChange={set('expected_attendees')} placeholder="e.g., 50" />
            </Field>
          </div>
          <Field label="Special Requirements / Notes">
            <Textarea id="vr-notes" value={form.notes} onChange={set('notes')} placeholder="Setup instructions, equipment needed, etc." rows={3} />
          </Field>
        </div>

        {/* Submit row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Your request will be forwarded to the Venue Office for confirmation.
          </p>
          <SubmitButton loading={loading} success={submitted} />
        </div>
      </form>
    </div>
  );
}
