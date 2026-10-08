import React from 'react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(4rem, 10vw, 6rem) 0',
        textAlign: 'center',
        background: 'var(--primary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '999px',
            fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'white',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-light)', display: 'inline-block' }} />
            OSAS Online Services
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem',
          }}
        >
          Submission Portal
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.125rem)',
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '560px',
            margin: '0 auto 3rem',
            lineHeight: 1.6,
          }}
        >
          A unified, secure platform for student organizations to submit event proposals, venue requests, and accreditation applications directly to OSAS.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}
        >
          {[
            { value: '3', label: 'Form Types' },
            { value: '24h', label: 'Avg. Response' },
            { value: '100%', label: 'Digital' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.6)', marginTop: '6px' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
