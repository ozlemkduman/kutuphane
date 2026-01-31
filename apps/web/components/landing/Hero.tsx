'use client';

import Link from 'next/link';
import { colors, borderRadius, shadows, spacing, transitions } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

export interface HeroProps {
  isAuthenticated?: boolean;
}

export const Hero = ({ isAuthenticated = false }: HeroProps) => {
  return (
    <section
      style={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: `${spacing['3xl']} ${spacing.xl}`,
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-labelledby="hero-title"
    >
      {/* Background Decoration */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: `radial-gradient(circle, ${colors.primary}20 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating Books Animation */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          fontSize: '60px',
          opacity: 0.1,
          animation: 'float 6s ease-in-out infinite',
        }}
        aria-hidden="true"
      >
        📚
      </div>
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          fontSize: '40px',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite',
          animationDelay: '1s',
        }}
        aria-hidden="true"
      >
        📖
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          fontSize: '50px',
          opacity: 0.1,
          animation: 'float 7s ease-in-out infinite',
          animationDelay: '2s',
        }}
        aria-hidden="true"
      >
        📕
      </div>

      {/* Logo */}
      <div
        style={{
          marginBottom: spacing.xl,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <img
          src="/logo-kitap.png"
          alt=""
          style={{
            height: '80px',
            width: 'auto',
            filter: 'drop-shadow(0 4px 20px rgba(217, 119, 6, 0.3))',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h1
        id="hero-title"
        style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 800,
          marginBottom: spacing.lg,
          background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.cream} 50%, ${colors.primaryLight} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          position: 'relative',
          zIndex: 1,
          lineHeight: 1.2,
        }}
      >
        Dijital Kütüphane
        <br />
        Deneyimi
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: colors.gray,
          maxWidth: '600px',
          marginBottom: spacing['2xl'],
          lineHeight: 1.7,
          position: 'relative',
          zIndex: 1,
        }}
      >
        Okulunuzun kütüphanesine dijital erişim. Kitapları keşfedin,
        ödünç alın ve okuma deneyiminizi zenginleştirin.
      </p>

      {/* CTA Buttons */}
      <div
        style={{
          display: 'flex',
          gap: spacing.lg,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: spacing['3xl'],
          position: 'relative',
          zIndex: 1,
        }}
      >
        {isAuthenticated ? (
          <Link href="/books">
            <Button
              size="lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                boxShadow: shadows.glowStrong,
                padding: '16px 40px',
                fontSize: '18px',
              }}
            >
              Kitapları Keşfet
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
                  padding: '16px 40px',
                  fontSize: '18px',
                }}
              >
                Hemen Başla
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                style={{
                  padding: '16px 40px',
                  fontSize: '18px',
                }}
              >
                Giriş Yap
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Trust Indicators */}
      <div
        style={{
          display: 'flex',
          gap: spacing['2xl'],
          flexWrap: 'wrap',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {[
          { icon: '🏫', value: '100+', label: 'Okul' },
          { icon: '📚', value: '50K+', label: 'Kitap' },
          { icon: '👨‍🎓', value: '10K+', label: 'Öğrenci' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <span style={{ fontSize: '28px' }}>{stat.icon}</span>
            <div>
              <p
                style={{
                  color: colors.white,
                  fontSize: '24px',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  color: colors.gray,
                  fontSize: '14px',
                  margin: 0,
                }}
              >
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: spacing['2xl'],
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'bounce 2s infinite',
        }}
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.gray}
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
