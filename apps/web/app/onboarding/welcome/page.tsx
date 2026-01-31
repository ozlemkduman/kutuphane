'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { colors, borderRadius, spacing, transitions, shadows } from '@/lib/theme';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Icons
const BookIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
  </svg>
);

const SearchDocIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" />
  </svg>
);

const HandRaisedIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.5 1.875a1.125 1.125 0 012.25 0v8.219c.517.162 1.02.382 1.5.659V3.375a1.125 1.125 0 012.25 0v10.937a4.505 4.505 0 00-3.25 2.373 8.963 8.963 0 014-.935A.75.75 0 0018 15v-2.266a3.368 3.368 0 01.988-2.37 1.125 1.125 0 011.591 1.59 1.118 1.118 0 00-.329.79v3.006h-.005a6 6 0 01-6 6h-1.5a6 6 0 01-6-6v-3.006a1.118 1.118 0 00-.329-.79 1.125 1.125 0 011.591-1.59 3.368 3.368 0 01.988 2.37V15a.75.75 0 00.75.75 8.963 8.963 0 014 .935 4.505 4.505 0 00-3.25-2.373V3.375a1.125 1.125 0 012.25 0v7.378c.48-.277.983-.497 1.5-.659V1.875z" />
  </svg>
);

const ArrowPathIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
  </svg>
);

const steps: Step[] = [
  {
    id: 1,
    title: 'Kitapları Keşfedin',
    description: 'Okulunuzun kütüphanesindeki tüm kitapları kategorilere göre keşfedin ve arayın.',
    icon: <SearchDocIcon />,
  },
  {
    id: 2,
    title: 'Ödünç Alın',
    description: 'İstediğiniz kitabı tek tıkla ödünç alın. Sistem otomatik olarak iade tarihini belirler.',
    icon: <HandRaisedIcon />,
  },
  {
    id: 3,
    title: 'Okuyun ve İade Edin',
    description: 'Kitabı okuyun ve süre dolmadan iade edin. Profilden tüm ödünç geçmişinizi takip edin.',
    icon: <ArrowPathIcon />,
  },
  {
    id: 4,
    title: 'Yeni Kitaplar Keşfedin',
    description: 'Popüler kitapları ve yeni eklenenleri takip edin. Her zaman okunacak yeni şeyler bulun!',
    icon: <BookIcon />,
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // Redirect if not logged in or doesn't have school
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && profile && !profile.schoolId && profile.role === 'MEMBER') {
      router.push('/onboarding/select-school');
      return;
    }
  }, [authLoading, user, profile, router]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finish onboarding
      router.push('/books');
    }
  };

  const handleSkip = () => {
    router.push('/books');
  };

  // Show loading while checking auth
  if (authLoading || !profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.sm,
            color: colors.primaryLight,
            textDecoration: 'none',
            marginBottom: spacing['3xl'],
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          <img
            src="/logo-kitap.png"
            alt=""
            style={{ height: '40px', width: 'auto' }}
          />
          Kitaphane
        </Link>

        {/* Progress Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.md,
            marginBottom: spacing['3xl'],
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: colors.success,
              color: colors.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div
            style={{
              width: '60px',
              height: '2px',
              backgroundColor: colors.primary,
            }}
          />
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: colors.primary,
              color: colors.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            2
          </div>
        </div>

        {/* Welcome Header */}
        {currentStep === 0 && (
          <div style={{ marginBottom: spacing['2xl'] }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: colors.white,
                marginBottom: spacing.md,
              }}
            >
              Hoş Geldin, {profile.name?.split(' ')[0]}!
            </h1>
            <p style={{ color: colors.gray, fontSize: '16px' }}>
              {profile.school?.name} kütüphanesine katıldın.
              <br />
              Hadi sistemin nasıl çalıştığına bakalım.
            </p>
          </div>
        )}

        {/* Step Content */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: borderRadius.xl,
            padding: spacing['2xl'],
            marginBottom: spacing['2xl'],
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: colors.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: spacing.xl,
              color: colors.primary,
            }}
          >
            {step.icon}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: colors.white,
              marginBottom: spacing.md,
            }}
          >
            {step.title}
          </h2>

          {/* Description */}
          <p
            style={{
              color: colors.gray,
              fontSize: '16px',
              lineHeight: 1.6,
            }}
          >
            {step.description}
          </p>
        </div>

        {/* Step Dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing['2xl'],
          }}
        >
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              style={{
                width: index === currentStep ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor:
                  index === currentStep ? colors.primary : colors.border,
                border: 'none',
                cursor: 'pointer',
                transition: `all ${transitions.normal}`,
              }}
              aria-label={`Adım ${index + 1}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'center',
          }}
        >
          <Button variant="ghost" onClick={handleSkip}>
            Atla
          </Button>
          <Button
            onClick={handleNext}
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              boxShadow: shadows.glow,
              minWidth: '150px',
            }}
          >
            {currentStep < steps.length - 1 ? 'İleri' : 'Başla'}
          </Button>
        </div>
      </div>
    </div>
  );
}
