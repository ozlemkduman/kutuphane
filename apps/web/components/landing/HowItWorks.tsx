'use client';

import { colors, borderRadius, spacing, transitions } from '@/lib/theme';

interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: '📝',
    title: 'Kayıt Ol',
    description: 'E-posta veya Google ile hızlıca kayıt olun ve okulunuzu seçin.',
  },
  {
    number: 2,
    icon: '🔍',
    title: 'Keşfet',
    description: 'Kitapları kategorilere göre keşfedin veya arama yapın.',
  },
  {
    number: 3,
    icon: '📖',
    title: 'Ödünç Al',
    description: 'İstediğiniz kitabı tek tıkla ödünç alın. 14 gün süreniz var.',
  },
  {
    number: 4,
    icon: '🔄',
    title: 'İade Et',
    description: 'Kitabı okuduktan sonra süre dolmadan iade edin.',
  },
];

export const HowItWorks = () => {
  return (
    <section
      style={{
        padding: `${spacing['4xl']} ${spacing.xl}`,
        backgroundColor: colors.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-labelledby="how-it-works-title"
    >
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${colors.border} 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
          <h2
            id="how-it-works-title"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: colors.white,
              marginBottom: spacing.md,
            }}
          >
            Nasıl Çalışır?
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: colors.gray,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Dört basit adımda kütüphane deneyiminizi başlatın.
          </p>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: spacing.xl,
            position: 'relative',
          }}
        >
          {/* Connection Line (desktop only) */}
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: '15%',
              right: '15%',
              height: '2px',
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`,
              display: 'none',
            }}
            className="connection-line"
            aria-hidden="true"
          />

          {steps.map((step) => (
            <article
              key={step.number}
              style={{
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Step Number */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                  color: colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: '0 auto',
                  marginBottom: spacing.lg,
                  boxShadow: `0 4px 20px ${colors.primary}40`,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {step.number}
              </div>

              {/* Icon */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: borderRadius.xl,
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  margin: '0 auto',
                  marginBottom: spacing.lg,
                  transition: `all ${transitions.normal}`,
                }}
              >
                {step.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: colors.white,
                  marginBottom: spacing.sm,
                }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '15px',
                  color: colors.gray,
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: '250px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .connection-line {
            display: block !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
