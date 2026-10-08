import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt } from 'react-icons/fa';
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

export default function EventProposalForm({ onSuccess }) {
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
    if (!form.title.trim()) e.title = 'Event title is required.';
    if (!form.event_date) e.event_date = 'Event date is required.';
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
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .ilike('name', `%${form.org_name.trim()}%`)
        .maybeSingle();

      const note = `[Public Submission] Org: ${form.org_name}${form.org_acronym ? ` (${form.org_acronym})` : ''}
Contact: ${form.contact_name} <${form.contact_email}>${form.contact_number ? ` / ${form.contact_number}` : ''}
${form.notes ? `\nNotes: ${form.notes}` : ''}`;

      const { error } = await supabase.from('event_proposals').insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date,
        event_time_start: form.event_time_start || null,
        event_time_end: form.event_time_end || null,
        venue: form.venue,
        expected_attendees: form.expected_attendees ? parseInt(form.expected_attendees) : null,
        organization_id: org?.id || null,
        status: 'pending',
        submitted_by: null,
        notes: note,
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
          background: 'linear-gradient(135deg, #03632B, #04823a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '1.2rem', flexShrink: 0,
        }}>
          <FaCalendarAlt />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Event Proposal
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Fill in the details below. OSAS will review your proposal within 1–3 business days.
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
        <div className="grid-2" style={{ marginBottom: '0' }}>
          <Field label="Organization Name" required error={errors.org_name}>
            <Input
              id="ep-org-name"
              value={form.org_name}
              onChange={set('org_name')}
              placeholder="e.g., Computer Science Society"
              error={errors.org_name}
            />
          </Field>
          <Field label="Acronym / Short Name">
            <Input
              id="ep-org-acronym"
              value={form.org_acronym}
              onChange={set('org_acronym')}
              placeholder="e.g., CSS"
            />
          </Field>
        </div>

        <FormDivider />

        {/* Section 2: Contact */}
        <SectionHeader number="2" title="Contact Person" />
        <div className="grid-3">
          <Field label="Full Name" required error={errors.contact_name}>
            <Input
              id="ep-contact-name"
              value={form.contact_name}
              onChange={set('contact_name')}
              placeholder="Juan Dela Cruz"
              error={errors.contact_name}
            />
          </Field>
          <Field label="Email Address" required error={errors.contact_email}>
            <Input
              id="ep-contact-email"
              type="email"
              value={form.contact_email}
              onChange={set('contact_email')}
              placeholder="juan@email.com"
              error={errors.contact_email}
            />
          </Field>
          <Field label="Contact Number">
            <Input
              id="ep-contact-number"
              value={form.contact_number}
              onChange={set('contact_number')}
              placeholder="09xx-xxx-xxxx"
            />
          </Field>
        </div>

        <FormDivider />

        {/* Section 3: Event Details */}
        <SectionHeader number="3" title="Event Details" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Event Title" required error={errors.title}>
            <Input
              id="ep-title"
              value={form.title}
              onChange={set('title')}
              placeholder="Enter the event title"
              error={errors.title}
            />
          </Field>
          <Field label="Description / Purpose">
            <Textarea
              id="ep-description"
              value={form.description}
              onChange={set('description')}
              placeholder="Brief description of the event and its purpose..."
              rows={3}
            />
          </Field>
          <div className="grid-3">
            <Field label="Event Date" required error={errors.event_date}>
              <Input
                id="ep-event-date"
                type="date"
                value={form.event_date}
                onChange={set('event_date')}
                min={new Date().toISOString().split('T')[0]}
                error={errors.event_date}
              />
            </Field>
            <Field label="Start Time">
              <Input
                id="ep-time-start"
                type="time"
                value={form.event_time_start}
                onChange={set('event_time_start')}
              />
            </Field>
            <Field label="End Time">
              <Input
                id="ep-time-end"
                type="time"
                value={form.event_time_end}
                onChange={set('event_time_end')}
              />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Requested Venue" required error={errors.venue}>
              <Select
                id="ep-venue"
                value={form.venue}
                onChange={set('venue')}
                error={errors.venue}
              >
                <option value="">Select a venue...</option>
                {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Expected Attendees">
              <Input
                id="ep-attendees"
                type="number"
                min="1"
                value={form.expected_attendees}
                onChange={set('expected_attendees')}
                placeholder="e.g., 50"
              />
            </Field>
          </div>
          <Field label="Additional Notes">
            <Textarea
              id="ep-notes"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Special requirements, setup instructions, etc."
              rows={3}
            />
          </Field>
        </div>

        {/* Submit row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            All submissions are reviewed by OSAS. You will be contacted via your email.
          </p>
          <SubmitButton loading={loading} success={submitted} />
        </div>
      </form>
    </div>
  );
}
