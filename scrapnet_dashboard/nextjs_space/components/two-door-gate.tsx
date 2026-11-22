'use client';

import { useRouter } from 'next/navigation';

export default function TwoDoorGate() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#030712',
        color: '#e2e8f0',
        fontFamily: "'Space Grotesk', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background */}
      <div
        style={{
          position: 'fixed',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(circle,rgba(6,182,212,.06) 0%,rgba(245,158,11,.04) 45%,transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Masthead */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '56px 24px 24px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '.28em',
            color: '#64748b',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Bedrock ESG · Forensic Carbon Verification
        </div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: '-.03em',
            color: '#f8fafc',
            lineHeight: 1.15,
          }}
        >
          Choose Your Path
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: '#94a3b8',
            maxWidth: 520,
            margin: '12px auto 0',
            lineHeight: 1.7,
          }}
        >
          Two ways in — explore verified carbon potential, or submit your facility
          data for a forensic verification report.
        </p>
      </div>

      {/* Two-panel gate */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 1040,
          margin: '0 auto',
          padding: '24px 24px 72px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
          gap: 24,
        }}
      >
        {/* DOOR I — Individual (cyan) */}
        <div
          style={{
            borderRadius: 4,
            padding: '40px 32px',
            background: 'rgba(15,23,42,.62)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(6,182,212,.28)',
            boxShadow: '0 0 60px -20px rgba(6,182,212,.25)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.18em',
              color: '#06b6d4',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            For Individuals
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-.02em',
              lineHeight: 1.25,
              marginBottom: 14,
            }}
          >
            Discover What Your Assets Are Worth
          </h2>
          <p
            style={{
              fontSize: 13,
              color: '#cbd5e1',
              lineHeight: 1.7,
              marginBottom: 32,
              flex: 1,
            }}
          >
            Browse verified carbon potential across every vertical — no forms, no
            jargon.
          </p>
          <button
            onClick={() => router.push('/discover')}
            style={{
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
            Explore the Platform →
          </button>
        </div>

        {/* DOOR II — Corporate/Industrial (amber) */}
        <div
          style={{
            borderRadius: 4,
            padding: '40px 32px',
            background: 'rgba(15,23,42,.62)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(245,158,11,.28)',
            boxShadow: '0 0 60px -20px rgba(245,158,11,.22)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.18em',
              color: '#f59e0b',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            For Industrial Operators
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-.02em',
              lineHeight: 1.25,
              marginBottom: 14,
            }}
          >
            Submit Your Facility Data
          </h2>
          <p
            style={{
              fontSize: 13,
              color: '#cbd5e1',
              lineHeight: 1.7,
              marginBottom: 24,
            }}
          >
            Get a forensic carbon verification report for your industrial operation.
          </p>

          {/* Trust signals — no numbers/splits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1 }}>
            {[
              'dMRV protocol reviewed',
              '24hr operator turnaround',
              'Facility-verified data only',
            ].map((signal) => (
              <div key={signal} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#f59e0b',
                    boxShadow: '0 0 6px #f59e0b',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: '#cbd5e1', letterSpacing: '.02em' }}>
                  {signal}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/bedrockfad')}
            style={{
              padding: '14px 24px',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: '#030712',
              background: '#f59e0b',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 0 24px -6px rgba(245,158,11,.6)',
            }}
          >
            Submit Your Facility Data →
          </button>
        </div>
      </div>
    </div>
  );
}
