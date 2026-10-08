import React from 'react';

// Reusable form primitives
export function Field({ label, required, error, children, hint }) {
  return (
    <div className="field-wrapper">
      {label && (
        <label className={`field-label ${required ? 'required' : ''}`}>{label}</label>
      )}
      {children}
      {hint && !error && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hint}</p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Input({ error, ...props }) {
  return (
    <input
      className={`field-input ${error ? 'error' : ''}`}
      {...props}
    />
  );
}

export function Textarea({ error, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`field-textarea ${error ? 'error' : ''}`}
      {...props}
    />
  );
}

export function Select({ error, children, ...props }) {
  return (
    <div className="select-wrapper">
      <select
        className={`field-select ${error ? 'error' : ''}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function SectionHeader({ number, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--primary)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.72rem',
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {number}
      </div>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        {title}
      </p>
    </div>
  );
}

export function FormDivider() {
  return <div className="divider" />;
}

export function Alert({ type, message }) {
  return (
    <div className={`alert alert-${type}`}>
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
        {type === 'success' ? '✅' : '❌'}
      </span>
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({ loading, success, label = 'Submit Request', loadingLabel = 'Submitting…' }) {
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={loading || success}
      style={{ minWidth: '160px' }}
    >
      {loading ? (
        <>
          <span className="spinner" />
          {loadingLabel}
        </>
      ) : success ? (
        <>✅ Submitted!</>
      ) : label}
    </button>
  );
}
