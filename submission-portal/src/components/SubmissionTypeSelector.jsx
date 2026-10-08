import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaCertificate, FaCheckCircle } from 'react-icons/fa';

const TYPES = [
  {
    id: 'event',
    label: 'Event Proposal',
    icon: FaCalendarAlt,
    color: '#03632B',
    gradient: 'linear-gradient(135deg, #03632B, #04823a)',
    desc: 'Propose a student organization event for OSAS review and approval.',
    features: ['Event details & venue', 'Organization info', 'Expected attendees'],
  },
  {
    id: 'venue',
    label: 'Venue Request',
    icon: FaMapMarkerAlt,
    color: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    desc: 'Request a campus venue or facility for your organization activity.',
    features: ['Preferred venue', 'Date & time', 'Activity description'],
  },
  {
    id: 'accreditation',
    label: 'Accreditation Application',
    icon: FaCertificate,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    desc: 'Apply for student organization accreditation or renewal with OSAS.',
    features: ['Organization details', 'Adviser information', 'Contact info'],
  },
];

export default function SubmissionTypeSelector({ activeType, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
      {TYPES.map((type, i) => {
        const Icon = type.icon;
        const isActive = activeType === type.id;
        return (
          <motion.button
            key={type.id}
            id={`type-btn-${type.id}`}
            className={`type-card ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(type.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: type.color,
                }}
              />
            )}

            {/* Icon */}
            <div className="icon-box" style={{ background: type.gradient }}>
              <Icon />
            </div>

            {/* Label & desc */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {type.label}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {type.desc}
              </p>
            </div>

            {/* Feature list */}
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: 0, padding: 0, listStyle: 'none' }}>
              {type.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <FaCheckCircle style={{ color: type.color, fontSize: '0.65rem', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div
              style={{
                marginTop: 'auto',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: isActive ? type.color : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s',
              }}
            >
              {isActive ? '▲ Close Form' : '▼ Open Form'}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
