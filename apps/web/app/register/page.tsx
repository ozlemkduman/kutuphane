'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { colors, spacing } from '@/lib/theme';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, profile } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === 'DEVELOPER') {
        router.push('/developer');
      } else if (!profile.schoolId && profile.role === 'MEMBER') {
        router.push('/onboarding/select-school');
      } else {
        router.push('/books');
      }
    }
  }, [authLoading, user, profile, router]);

  // Show loading while checking auth state
  if (authLoading) {
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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
      }}
    >
      <RegisterForm />
    </div>
  );
}
