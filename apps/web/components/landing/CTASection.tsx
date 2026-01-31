'use client';

import Link from 'next/link';
import { colors, borderRadius, shadows, spacing } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

export interface CTASectionProps {
  isAuthenticated?: boolean;
}

export const CTASection = ({ isAuthenticated = false }: CTASectionProps) => {
  return (
    <section
      style={{
        padding: `${spacing['4xl']} ${spacing.xl}`,
        backgroundColor: colors.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-labelledby="cta-title"
    >
      {/* Background Gradient */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at center, ${colors.primary}15 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing.xl,
            fontSize: '36px',
            boxShadow: shadows.glowStrong,
          }}
        >
          📚
        </div>

        {/* Title */}
        <h2
          id="cta-title"
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700,
            color: colors.white,
            marginBottom: spacing.lg,
            lineHeight: 1.2,
          }}
        >
          Kitap Okuma Maceranıza
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Bugün Başlayın
          </span>
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '18px',
            color: colors.gray,
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: `0 auto ${spacing['2xl']}`,
          }}
        >
          Binlerce kitap arasından seçim yapın, okuma listelerinizi oluşturun ve
          dijital kütüphane deneyiminin keyfini çıkarın.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: spacing.lg,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {isAuthenticated ? (
            <Link href="/books">
              <Button
                size="lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                  boxShadow: shadows.glowStrong,
                  padding: '18px 48px',
                  fontSize: '18px',
                }}
              >
                Kütüphaneye Git
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button
                  size="lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                    boxShadow: shadows.glowStrong,
                    padding: '18px 48px',
                    fontSize: '18px',
                  }}
                >
                  Ücretsiz Kayıt Ol
                </Button>
              </Link>
              <Link href="/books">
                <Button
                  variant="outline"
                  size="lg"
                  style={{
                    padding: '18px 48px',
                    fontSize: '18px',
                  }}
                >
                  Kitapları İncele
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Features List */}
        <div
          style={{
            display: 'flex',
            gap: spacing.xl,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: spacing['2xl'],
          }}
        >
          {['Ücretsiz kullanım', 'Kolay kayıt', '7/24 erişim'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                color: colors.gray,
                fontSize: '14px',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill={colors.success}
              >
                <path
                  fillRule="evenodd"
                  d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
                  clipRule="evenodd"
                />
              </svg>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
