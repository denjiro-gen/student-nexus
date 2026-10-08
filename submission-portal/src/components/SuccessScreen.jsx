import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarCheck, FaBuilding, FaAward } from 'react-icons/fa';

const TYPE_LABELS = {
  event: {
    icon: FaCalendarCheck,
    title: 'Event Proposal Submitted!',
    desc: 'Your event proposal has been sent to OSAS for review. You will receive a confirmation email within 1–3 business days.',
    color: '#03632B',
    nextSteps: [
      'Watch your email for a confirmation from OSAS',
      'Prepare any required supporting documents',
      'OSAS may contact you for additional details',
    ],
  },
  venue: {
    icon: FaBuilding,
    title: 'Venue Request Received!',
    desc: 'Your venue request has been forwarded to the appropriate office. Our team will contact you to confirm availability.',
    color: '#1d4ed8',
    nextSteps: [
      'Check your email for a booking confirmation',
      'Availability is subject to scheduling',
      'Contact OSAS if you need to modify or cancel',
    ],
  },
  accreditation: {
    icon: FaAward,
    title: 'Application Received!',
    desc: 'Your accreditation application has been submitted successfully. OSAS will guide you through the next steps.',
    color: '#7c3aed',
    nextSteps: [
      'Expect an email with a checklist of requirements',
      'Prepare your organization\'s documents',
      'Schedule a meeting with OSAS if needed',
    ],
  },
};

export default function SuccessScreen({ type, onReset }) {
  const config = TYPE_LABELS[type] || TYPE_LABELS.event;

  return (
    <motion.div
      className="card"
      style={{ padding: '3rem 2.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `linear-gradient(135deg, ${config.color}20, ${config.color}40)`,
          border: `3px solid ${config.color}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 1.5rem', color: config.color
        }}
      >
        <config.icon />
      </motion.div>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}
      >
        {config.title}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '2rem' }}
      >
        {config.desc}
      </motion.p>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          textAlign: 'left',
        }}
      >
        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          What happens next
        </p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none', padding: 0, margin: 0 }}>
          {config.nextSteps.map((step, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: config.color, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <button className="btn btn-primary" onClick={onReset} style={{ minWidth: '160px' }}>
          Submit Another
        </button>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ minWidth: '140px' }}
        >
          Back to Website
        </a>
      </motion.div>
    </motion.div>
  );
}
