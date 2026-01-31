'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { colors, spacing, transitions } from '@/lib/theme';

// Email Icon Component
const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
  </svg>
);

// Arrow Left Icon
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

// Error messages mapping
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'Bu e-posta adresi ile kayıtlı bir hesap bulunamadı.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.',
    'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin.',
  };

  return errorMessages[errorCode] || 'Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.';
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

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
        variant="default"
        padding="lg"
        style={{
          width: '100%',
          maxWidth: '420px',
        }}
      >
        {/* Back to Login Link */}
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.sm,
            color: colors.gray,
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: spacing.xl,
            transition: `color ${transitions.fast}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.gray;
          }}
        >
          <ArrowLeftIcon />
          Giriş sayfasına dön
        </Link>

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
            marginBottom: spacing.xl,
            fontSize: '18px',
            fontWeight: 'bold',
          }}
          aria-label="Ana sayfaya git"
        >
          <img
            src="/logo-kitap.png"
            alt=""
            style={{ height: '40px', width: 'auto' }}
            aria-hidden="true"
          />
          Kitaphane
        </Link>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: spacing.md,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Şifremi Unuttum
        </h1>

        {/* Description */}
        <p
          style={{
            textAlign: 'center',
            color: colors.gray,
            fontSize: '15px',
            marginBottom: spacing.xl,
            lineHeight: 1.6,
          }}
        >
          E-posta adresinizi girin. Size şifre sıfırlama bağlantısı göndereceğiz.
        </p>

        {/* Success Message */}
        {success && (
          <div style={{ marginBottom: spacing.lg }}>
            <Alert variant="success" title="E-posta Gönderildi">
              Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
              Lütfen gelen kutunuzu kontrol edin. E-posta birkaç dakika içinde gelmezse
              spam klasörünüzü de kontrol etmeyi unutmayın.
            </Alert>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ marginBottom: spacing.lg }}>
            <Alert variant="error" dismissible onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Form */}
        {!success ? (
          <form onSubmit={handleSubmit}>
            <Input
              type="email"
              label="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@eposta.com"
              leftIcon={<EmailIcon />}
              required
              autoComplete="email"
              autoFocus
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                marginTop: spacing.md,
              }}
            >
              Şifre Sıfırlama Bağlantısı Gönder
            </Button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
            >
              Farklı E-posta Dene
            </Button>
            <Link href="/login" style={{ display: 'block' }}>
              <Button variant="outline" fullWidth>
                Giriş Sayfasına Git
              </Button>
            </Link>
          </div>
        )}

        {/* Help Text */}
        <div
          style={{
            marginTop: spacing.xl,
            padding: spacing.lg,
            backgroundColor: colors.bg,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
          }}
        >
          <h3
            style={{
              color: colors.white,
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: spacing.sm,
            }}
          >
            Yardım mı lazım?
          </h3>
          <p
            style={{
              color: colors.gray,
              fontSize: '13px',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            E-posta almadıysanız, spam klasörünüzü kontrol edin veya farklı bir e-posta adresi deneyin.
            Hala sorun yaşıyorsanız okul yöneticinizle iletişime geçin.
          </p>
        </div>
      </Card>
    </div>
  );
}
