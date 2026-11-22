'use client';

import React, { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 13,
  color: '#e2e8f0',
  background: 'rgba(15,23,42,.6)',
  border: '1px solid #334155',
  borderRadius: 3,
  outline: 'none',
  fontFamily: 'inherit',
  marginTop: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
};

export default function Step1Gate({
  onNext,
}: {
  onNext: (payload: {
    companyName: string;
    contactName: string;
    contactEmail: string;
  }) => void;
}) {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const companyValid = company.trim().length > 0;
  const contactValid = contact.trim().length > 0;
  const emailValid = EMAIL_RE.test(email.trim());
  const allValid = companyValid && contactValid && emailValid;

  const handleContinue = () => {
    setTouched(true);
    if (allValid)
      onNext({
        companyName: company.trim(),
        contactName: contact.trim(),
        contactEmail: email.trim(),
      });
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '40px 28px',
        background: 'rgba(15,23,42,.62)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(6,182,212,.18)',
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.18em',
          color: '#06b6d4',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Step 1 · Contact Info
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 24 }}>
        Tell us about your operation
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Company Name *</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Industrial Inc."
            style={{
              ...fieldStyle,
              borderColor: touched && !companyValid ? '#ef4444' : '#334155',
            }}
          />
          {touched && !companyValid && (
            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>
              Company name is required.
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Contact Name *</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Jane Operator"
            style={{
              ...fieldStyle,
              borderColor: touched && !contactValid ? '#ef4444' : '#334155',
            }}
          />
          {touched && !contactValid && (
            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>
              Contact name is required.
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Work Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
            style={{
              ...fieldStyle,
              borderColor: touched && !emailValid ? '#ef4444' : '#334155',
            }}
          />
          {touched && !emailValid && (
            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>
              Enter a valid work email address.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleContinue}
        style={{
          marginTop: 28,
          width: '100%',
          padding: '14px 24px',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: '#030712',
          background: '#06b6d4',
          border: 'none',
          borderRadius: 3,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 0 24px -6px rgba(6,182,212,.6)',
        }}
      >
        Continue →
      </button>
    </div>
  );
}
