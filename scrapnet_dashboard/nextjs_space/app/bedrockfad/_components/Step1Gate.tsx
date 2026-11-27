'use client';

import React, { useState } from 'react';
import HelpTooltip from '@/components/ui/HelpTooltip';

export type IntakeTrack = 'residential' | 'commercial';

export interface IntakePayload {
  // Canonical fields — always sent, backend zod-validated.
  companyName: string;
  contactName: string;
  contactEmail: string;
  // Extended, track-specific context (client-side display; appended to the
  // request but not persisted server-side until the Sprint-8 schema pass).
  track: IntakeTrack;
  zip: string;
  facilityType?: string;
  sqFt?: string;
  equipment?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}$/;

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

const errStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#ef4444',
  marginTop: 4,
};

export default function Step1Gate({
  track,
  onNext,
  referralCode,
  initial,
}: {
  track: IntakeTrack;
  onNext: (payload: IntakePayload) => void;
  referralCode?: string | null;
  initial?: IntakePayload | null;
}) {
  const residential = track === 'residential';
  const accent = residential ? '#06b6d4' : '#f59e0b';

  // Field state (shared across tracks; unused fields simply stay blank).
  const [name, setName] = useState(
    initial ? (residential ? initial.contactName : '') : '',
  );
  const [company, setCompany] = useState(
    initial && !residential ? initial.companyName : '',
  );
  const [contact, setContact] = useState(
    initial && !residential ? initial.contactName : '',
  );
  const [email, setEmail] = useState(initial?.contactEmail ?? '');
  const [zip, setZip] = useState(initial?.zip ?? '');
  const [facilityType, setFacilityType] = useState(initial?.facilityType ?? '');
  const [sqFt, setSqFt] = useState(initial?.sqFt ?? '');
  const [equipment, setEquipment] = useState(initial?.equipment ?? '');

  const [blurred, setBlurred] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const markBlur = (k: string) => setBlurred((b) => ({ ...b, [k]: true }));
  const show = (k: string) => blurred[k] || submitAttempted;

  // Per-field validity.
  const nameValid = name.trim().length > 0;
  const companyValid = company.trim().length > 0;
  const contactValid = contact.trim().length > 0;
  const emailValid = EMAIL_RE.test(email.trim());
  const zipValid = ZIP_RE.test(zip.trim());
  const facilityValid = facilityType.trim().length > 0;
  const sqFtValid = sqFt.trim().length > 0;

  const allValid = residential
    ? nameValid && emailValid && zipValid
    : companyValid &&
      contactValid &&
      emailValid &&
      facilityValid &&
      zipValid &&
      sqFtValid;

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (!allValid) return;
    if (residential) {
      onNext({
        companyName: name.trim(), // homeowner name doubles as the entity label
        contactName: name.trim(),
        contactEmail: email.trim(),
        track: 'residential',
        zip: zip.trim(),
      });
    } else {
      onNext({
        companyName: company.trim(),
        contactName: contact.trim(),
        contactEmail: email.trim(),
        track: 'commercial',
        zip: zip.trim(),
        facilityType: facilityType.trim(),
        sqFt: sqFt.trim(),
        equipment: equipment.trim() || undefined,
      });
    }
  };

  const inputBorder = (ok: boolean, key: string) =>
    show(key) && !ok ? '#ef4444' : '#334155';

  return (
    <div
      style={{
        maxWidth: residential ? 480 : 560,
        margin: '0 auto',
        padding: '40px 28px',
        background: 'rgba(15,23,42,.62)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: `1px solid ${residential ? 'rgba(6,182,212,.18)' : 'rgba(245,158,11,.18)'}`,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.18em',
          color: accent,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Step 1 · Submit Your Information
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
        {residential ? 'Tell us about your home' : 'Tell us about your operation'}
      </h2>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>
        {residential
          ? 'Just three quick details and we handle the rest.'
          : 'A few facility details help us route your forensic review.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {residential ? (
          <>
            <div>
              <label style={labelStyle}>Your Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => markBlur('name')}
                placeholder="Jane Homeowner"
                style={{ ...fieldStyle, borderColor: inputBorder(nameValid, 'name') }}
              />
              {show('name') && !nameValid && <div style={errStyle}>Your name is required.</div>}
            </div>
            <div>
              <label style={labelStyle}>
                Email *
                <HelpTooltip content="Used only for submission status updates. Never shared or used for marketing." />
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markBlur('email')}
                placeholder="jane@email.com"
                style={{ ...fieldStyle, borderColor: inputBorder(emailValid, 'email') }}
              />
              {show('email') && !emailValid && (
                <div style={errStyle}>Enter a valid email address.</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>ZIP Code *</label>
              <input
                type="text"
                inputMode="numeric"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                onBlur={() => markBlur('zip')}
                placeholder="89101"
                style={{ ...fieldStyle, borderColor: inputBorder(zipValid, 'zip') }}
              />
              {show('zip') && !zipValid && (
                <div style={errStyle}>Enter a valid 5-digit ZIP code.</div>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={labelStyle}>
                Company Name *
                <HelpTooltip content="Enter the legal entity name associated with the facility being submitted." />
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onBlur={() => markBlur('company')}
                placeholder="Acme Industrial Inc."
                style={{ ...fieldStyle, borderColor: inputBorder(companyValid, 'company') }}
              />
              {show('company') && !companyValid && (
                <div style={errStyle}>Company name is required.</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Contact Name *</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                onBlur={() => markBlur('contact')}
                placeholder="Jane Operator"
                style={{ ...fieldStyle, borderColor: inputBorder(contactValid, 'contact') }}
              />
              {show('contact') && !contactValid && (
                <div style={errStyle}>Contact name is required.</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>
                Work Email *
                <HelpTooltip content="Used only for submission status updates. Never shared or used for marketing." />
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markBlur('email')}
                placeholder="jane@acme.com"
                style={{ ...fieldStyle, borderColor: inputBorder(emailValid, 'email') }}
              />
              {show('email') && !emailValid && (
                <div style={errStyle}>Enter a valid work email address.</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Facility Type *</label>
              <input
                type="text"
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
                onBlur={() => markBlur('facility')}
                placeholder="Data center, cold storage, manufacturing…"
                style={{ ...fieldStyle, borderColor: inputBorder(facilityValid, 'facility') }}
              />
              {show('facility') && !facilityValid && (
                <div style={errStyle}>Facility type is required.</div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>ZIP Code *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                  onBlur={() => markBlur('zip')}
                  placeholder="89101"
                  style={{ ...fieldStyle, borderColor: inputBorder(zipValid, 'zip') }}
                />
                {show('zip') && !zipValid && (
                  <div style={errStyle}>Valid 5-digit ZIP required.</div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Square Footage *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sqFt}
                  onChange={(e) => setSqFt(e.target.value)}
                  onBlur={() => markBlur('sqft')}
                  placeholder="120,000"
                  style={{ ...fieldStyle, borderColor: inputBorder(sqFtValid, 'sqft') }}
                />
                {show('sqft') && !sqFtValid && (
                  <div style={errStyle}>Square footage is required.</div>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Primary Equipment (optional)</label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="Chillers, CRAC units, boilers…"
                style={fieldStyle}
              />
            </div>
          </>
        )}
      </div>

      {referralCode && (
        <div
          style={{
            marginTop: 20,
            padding: '12px 14px',
            borderRadius: 3,
            background: 'rgba(6,182,212,.06)',
            border: '1px solid rgba(6,182,212,.22)',
          }}
        >
          <div style={{ ...labelStyle, marginBottom: 4 }}>Referred by</div>
          <div
            style={{
              fontSize: 13,
              fontFamily: 'monospace',
              letterSpacing: '.08em',
              color: '#22d3ee',
            }}
          >
            Partner Code: {referralCode}
          </div>
        </div>
      )}

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
          background: accent,
          border: 'none',
          borderRadius: 3,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: `0 0 24px -6px ${residential ? 'rgba(6,182,212,.6)' : 'rgba(245,158,11,.6)'}`,
        }}
      >
        Continue →
      </button>
    </div>
  );
}
