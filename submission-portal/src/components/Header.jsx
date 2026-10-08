import React from 'react';
import { motion } from 'framer-motion';
import { FaExternalLinkAlt } from 'react-icons/fa';
import logoImg from '../assets/logo.png';

export default function Header() {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
        {/* Logo */}
        <motion.a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
          whileHover={{ opacity: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <img src={logoImg} alt="OSAS Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Student Nexus
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
              Colegio de Montalban
            </p>
          </div>
        </motion.a>

        {/* Center Text (Hidden on very small screens) */}
        <div style={{
          display: 'none',
          '@media (minWidth: 640px)': { display: 'flex' },
          alignItems: 'center'
        }} className="hidden sm:flex">
          <span style={{ fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.03em', color: 'var(--text-secondary)' }}>
            Online Submission Portal
          </span>
        </div>

        {/* Right — Main Website Link */}
        <motion.a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none'
          }}
          whileHover={{ color: 'var(--primary)' }}
        >
          Main Website
          <FaExternalLinkAlt style={{ fontSize: '0.75rem', opacity: 0.7 }} />
        </motion.a>
      </div>
    </header>
  );
}
