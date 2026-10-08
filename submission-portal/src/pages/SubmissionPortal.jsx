import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRegClipboard, FaRegEnvelope, FaHeadset } from 'react-icons/fa';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import SubmissionTypeSelector from '../components/SubmissionTypeSelector';
import EventProposalForm from '../components/forms/EventProposalForm';
import VenueRequestForm from '../components/forms/VenueRequestForm';
import AccreditationForm from '../components/forms/AccreditationForm';
import SuccessScreen from '../components/SuccessScreen';
import Footer from '../components/Footer';

export default function SubmissionPortal() {
  const [activeType, setActiveType] = useState(null); // null | 'event' | 'venue' | 'accreditation'
  const [submittedType, setSubmittedType] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSelectType = useCallback((type) => {
    setActiveType(prev => prev === type ? null : type);
    setShowSuccess(false);
    // Scroll to form
    setTimeout(() => {
      document.getElementById('submission-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleSuccess = useCallback((type) => {
    setSubmittedType(type);
    setShowSuccess(true);
    setActiveType(null);
    setTimeout(() => {
      document.getElementById('submission-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleReset = useCallback(() => {
    setShowSuccess(false);
    setSubmittedType(null);
    setActiveType(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderForm = () => {
    switch (activeType) {
      case 'event':
        return <EventProposalForm onSuccess={() => handleSuccess('event')} />;
      case 'venue':
        return <VenueRequestForm onSuccess={() => handleSuccess('venue')} />;
      case 'accreditation':
        return <AccreditationForm onSuccess={() => handleSuccess('accreditation')} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <HeroSection />

        {/* Type Selector */}
        <section style={{ padding: '4rem 0 2rem' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span className="section-overline">Submit a Request</span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Choose Your <span style={{ color: 'var(--primary)' }}>Submission Type</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto' }}>
                Select the type of request you'd like to submit. All submissions go directly to OSAS for review.
              </p>
            </div>
            <SubmissionTypeSelector activeType={activeType} onSelect={handleSelectType} />
          </div>
        </section>

        {/* Form / Success Area */}
        <section id="submission-form" style={{ padding: '0 0 4rem' }}>
          <div className="container">
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <SuccessScreen type={submittedType} onReset={handleReset} />
                </motion.div>
              ) : activeType ? (
                <motion.div
                  key={activeType}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  {renderForm()}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </section>

        {/* Info Cards */}
        <InfoSection />
      </main>
      <Footer />
    </div>
  );
}

function InfoSection() {
  const items = [
    {
      icon: FaRegClipboard,
      title: 'How It Works',
      desc: 'Fill out the form for your chosen request type. Our OSAS team reviews every submission within 1–3 business days.',
    },
    {
      icon: FaRegEnvelope,
      title: 'Stay Updated',
      desc: 'You\'ll be contacted via the email address you provide. Check your inbox (and spam folder) for updates.',
    },
    {
      icon: FaHeadset,
      title: 'Need Help?',
      desc: 'Contact the OSAS office directly at osas@university.edu or visit the Student Center Building.',
    },
  ];

  return (
    <section style={{ padding: '3rem 0', background: 'var(--surface-3)', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="card"
              style={{ padding: '1.75rem' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}><item.icon /></div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
