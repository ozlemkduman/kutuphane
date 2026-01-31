'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { colors, borderRadius, spacing, shadows } from '@/lib/theme';

// Clock Icon
const ClockIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style={{ color: colors.warning }}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
  </svg>
);

// Check Icon
const CheckIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style={{ color: colors.success }}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

// X Icon
const XIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style={{ color: colors.error }}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
  </svg>
);

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  // Redirect based on status
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && profile) {
      // If approved, redirect to books
      if (profile.status === 'APPROVED') {
        router.push('/books');
        return;
      }

      // If no school selected, redirect to school selection
      if (!profile.schoolId && profile.role === 'MEMBER') {
        router.push('/onboarding/select-school');
        return;
      }

      // DEVELOPER and ADMIN don't need approval
      if (profile.role !== 'MEMBER') {
        router.push(profile.role === 'DEVELOPER' ? '/developer' : '/books');
        return;
      }
    }
  }, [authLoading, user, profile, router]);

  const handleCheckStatus = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Loading state
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

  // Determine status display
  const getStatusInfo = () => {
    if (!profile) {
      return {
        icon: <ClockIcon />,
        title: 'Kayit Isleniyor',
        message: 'Kaydiniz isleniyor, lutfen bekleyin...',
        color: colors.warning,
      };
    }

    switch (profile.status) {
      case 'APPROVED':
        return {
          icon: <CheckIcon />,
          title: 'Onaylandi!',
          message: 'Hesabiniz onaylandi. Sisteme giris yapabilirsiniz.',
          color: colors.success,
        };
      case 'REJECTED':
        return {
          icon: <XIcon />,
          title: 'Basvuru Reddedildi',
          message: 'Uzgunuz, okul yoneticiniz basvurunuzu onaylamadi.',
          color: colors.error,
        };
      default:
        return {
          icon: <ClockIcon />,
          title: 'Onay Bekleniyor',
          message: 'Basvurunuz okul yoneticisi tarafindan inceleniyor.',
          color: colors.warning,
        };
    }
  };

  const statusInfo = getStatusInfo();

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
      <Card
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          padding: spacing['2xl'],
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            color: colors.primaryLight,
            textDecoration: 'none',
            marginBottom: spacing['2xl'],
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          <span style={{ fontSize: '32px' }}><img
            src="/logo-kitap.png"
            alt=""
            style={{ height: '40px', width: 'auto' }}
            aria-hidden="true"
          /></span>
          Kitaphane
        </Link>

        {/* Status Icon */}
        <div style={{ marginBottom: spacing.xl }}>
          {statusInfo.icon}
        </div>

        {/* Status Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: statusInfo.color,
            marginBottom: spacing.md,
          }}
        >
          {statusInfo.title}
        </h1>

        {/* Status Message */}
        <p
          style={{
            color: colors.gray,
            fontSize: '16px',
            marginBottom: spacing.xl,
            lineHeight: 1.6,
          }}
        >
          {statusInfo.message}
        </p>

        {/* User Info */}
        {profile && (
          <div
            style={{
              backgroundColor: colors.bgLight,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.xl,
              textAlign: 'left',
            }}
          >
            <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.sm }}>
              <strong style={{ color: colors.white }}>Ad Soyad:</strong> {profile.name}
            </p>
            <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.sm }}>
              <strong style={{ color: colors.white }}>E-posta:</strong> {profile.email}
            </p>
            {profile.school && (
              <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.sm }}>
                <strong style={{ color: colors.white }}>Okul:</strong> {profile.school.name}
              </p>
            )}
            {profile.className && (
              <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.sm }}>
                <strong style={{ color: colors.white }}>Sinif:</strong> {profile.className}-{profile.section}
              </p>
            )}
            {profile.studentNumber && (
              <p style={{ color: colors.gray, fontSize: '14px', margin: 0 }}>
                <strong style={{ color: colors.white }}>Okul No:</strong> {profile.studentNumber}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: spacing.md, flexDirection: 'column' }}>
          {(profile?.status === 'PENDING' || profile?.status === 'REJECTED') && (
            <Button
              onClick={handleCheckStatus}
              loading={checking}
              fullWidth
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              }}
            >
              Durumu Kontrol Et
            </Button>
          )}

          {profile?.status === 'APPROVED' && (
            <Button
              onClick={() => router.push('/books')}
              fullWidth
              style={{
                background: `linear-gradient(135deg, ${colors.success}, ${colors.success}dd)`,
              }}
            >
              Sisteme Gir
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleSignOut}
            fullWidth
          >
            Cikis Yap
          </Button>
        </div>

        {/* Help Text - Pending */}
        {profile?.status === 'PENDING' && (
          <p
            style={{
              color: colors.darkGray,
              fontSize: '13px',
              marginTop: spacing.xl,
            }}
          >
            Onay sureci genellikle 1-2 is gunu icinde tamamlanir.
            Sorulariniz icin okul yoneticinizle iletisime gecebilirsiniz.
          </p>
        )}

        {/* Help Text - Rejected */}
        {profile?.status === 'REJECTED' && (
          <div
            style={{
              marginTop: spacing.xl,
              padding: spacing.lg,
              backgroundColor: `${colors.error}15`,
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.error}30`,
            }}
          >
            <h4
              style={{
                color: colors.error,
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: spacing.sm,
              }}
            >
              Neden reddedilmis olabilir?
            </h4>
            <ul
              style={{
                color: colors.gray,
                fontSize: '13px',
                margin: 0,
                paddingLeft: spacing.lg,
                lineHeight: 1.6,
              }}
            >
              <li>Girdiginiz ogrenci bilgileri hatali olabilir</li>
              <li>Bu okul numarasi baska bir hesapta kullaniliyor olabilir</li>
              <li>Okul kayitlarinizda bir uyusmazlik olabilir</li>
            </ul>
            <p
              style={{
                color: colors.gray,
                fontSize: '13px',
                marginTop: spacing.md,
                marginBottom: 0,
              }}
            >
              Lutfen okul yoneticinizle iletisime gecin veya dogru bilgilerle yeni bir hesap olusturun.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
