'use client';

import { colors, borderRadius, shadows, spacing, transitions } from '@/lib/theme';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: '⚡',
    title: 'Hızlı',
    description: 'Saniyeler içinde kitap arayın ve ödünç alın. Modern arayüz ile kolay kullanım.',
    color: colors.primary,
  },
  {
    icon: '🌍',
    title: 'Erişilebilir',
    description: 'Her yerden, her cihazdan okulunuzun kütüphanesine erişin.',
    color: '#22c55e',
  },
  {
    icon: '🔒',
    title: 'Güvenli',
    description: 'Verileriniz güvenle saklanır. Güvenilir altyapı ile 7/24 erişim.',
    color: '#3b82f6',
  },
  {
    icon: '🎁',
    title: 'Ücretsiz',
    description: 'Okulunuzun üyesi olarak tüm özelliklere ücretsiz erişim hakkı.',
    color: '#a855f7',
  },
];

export const Features = () => {
  return (
    <section
      style={{
        padding: `${spacing['4xl']} ${spacing.xl}`,
        backgroundColor: colors.bgLight,
      }}
      aria-labelledby="features-title"
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
          <h2
            id="features-title"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: colors.white,
              marginBottom: spacing.md,
            }}
          >
            Neden Kitaphane?
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: colors.gray,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Modern kütüphane deneyimi için ihtiyacınız olan her şey.
          </p>
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: spacing.xl,
          }}
        >
          {features.map((feature) => (
            <article
              key={feature.title}
              style={{
                backgroundColor: colors.card,
                borderRadius: borderRadius.xl,
                padding: spacing['2xl'],
                border: `1px solid ${colors.border}`,
                transition: `all ${transitions.normal}`,
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = shadows.lg;
                e.currentTarget.style.borderColor = feature.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: borderRadius.lg,
                  backgroundColor: `${feature.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  marginBottom: spacing.lg,
                }}
              >
                {feature.icon}
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
                {feature.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '15px',
                  color: colors.gray,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
