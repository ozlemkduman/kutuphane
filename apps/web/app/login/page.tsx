'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { colors, borderRadius, shadows, spacing, transitions } from '@/lib/theme';

// Google Icon Component
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Email Icon Component
const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
  </svg>
);

// Lock Icon Component
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
  </svg>
);

// Error messages mapping
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'Bu e-posta adresi ile kayıtlı bir hesap bulunamadı.',
    'auth/wrong-password': 'Girdiğiniz şifre hatalı.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
    'auth/too-many-requests': 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.',
    'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/popup-closed-by-user': 'Google giriş penceresi kapatıldı.',
  };

  return errorMessages[errorCode] || 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    // Auth yüklenene kadar bekle
    if (authLoading) return;

    if (user && profile) {
      // MEMBER'lar icin durum kontrolu
      if (profile.role === 'MEMBER') {
        // Reddedilmis kullanicilar - cikis yaptir, login sayfasinda kalsin
        if (profile.status === 'REJECTED') {
          auth.signOut();
          return;
        }
        // Onay bekleyenler - pending sayfasina
        if (profile.status === 'PENDING') {
          router.replace('/pending-approval');
          return;
        }
        // Okul secimi gerekiyor
        if (!profile.schoolId) {
          router.replace('/onboarding/select-school');
          return;
        }
      }

      // DEVELOPER ise developer sayfasina
      if (profile.role === 'DEVELOPER') {
        router.replace('/developer');
        return;
      }

      // Diger durumlarda books'a yonlendir
      router.replace('/books');
    }
  }, [authLoading, user, profile, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();

      // Check user role for redirect
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (userRes.ok) {
        const userData = await userRes.json();

        // MEMBER'lar icin durum kontrolu
        if (userData.role === 'MEMBER') {
          // Reddedilmis kullanicilar giris yapamasin
          if (userData.status === 'REJECTED') {
            setError('Basvurunuz okul yoneticiniz tarafindan reddedildi. Detaylar icin okul yoneticinizle iletisime gecin.');
            return;
          }
          // Onay bekleyenler pending sayfasina
          if (userData.status === 'PENDING') {
            router.push('/pending-approval');
            return;
          }
          if (!userData.schoolId) {
            router.push('/onboarding/select-school');
            return;
          }
        }

        // DEVELOPER ise developer sayfasina
        if (userData.role === 'DEVELOPER') {
          router.push('/developer');
          return;
        }

        router.push('/books');
      } else if (userRes.status === 404) {
        // Kullanici kayitli degil - kayit sayfasina yonlendir
        router.push('/register');
      } else {
        router.push('/books');
      }
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      // Kullanicinin kayitli olup olmadigini kontrol et
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (userRes.ok) {
        const userData = await userRes.json();

        // MEMBER'lar icin durum kontrolu
        if (userData.role === 'MEMBER') {
          // Reddedilmis kullanicilar giris yapamasin
          if (userData.status === 'REJECTED') {
            await auth.signOut();
            setError('Basvurunuz okul yoneticiniz tarafindan reddedildi. Detaylar icin okul yoneticinizle iletisime gecin.');
            return;
          }
          // Onay bekleyenler pending sayfasina
          if (userData.status === 'PENDING') {
            router.push('/pending-approval');
            return;
          }
          if (!userData.schoolId) {
            // Eski kullanicilar icin - okul secimi gerekiyor
            router.push('/onboarding/select-school');
            return;
          }
        }

        // DEVELOPER ise developer sayfasina
        if (userData.role === 'DEVELOPER') {
          router.push('/developer');
          return;
        }

        router.push('/books');
      } else if (userRes.status === 404) {
        // Kayitli degil - Firebase'den cikis yap ve kayit sayfasina yonlendir
        await auth.signOut();
        setError('Bu Google hesabi ile kayitli bir kullanici bulunamadi. Lutfen once kayit olun.');
      } else {
        await auth.signOut();
        setError('Giris yapilamadi. Lutfen tekrar deneyin.');
      }
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state or redirecting
  // authLoading: Firebase auth kontrolü yapılıyor
  // user && profile: Kullanıcı giriş yapmış, redirect olacak
  const isRedirecting = !authLoading && user && profile;

  if (authLoading || isRedirecting) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.lg,
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
        <p style={{ color: colors.gray, fontSize: '14px' }}>
          {isRedirecting ? 'Yönlendiriliyor...' : 'Yükleniyor...'}
        </p>
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
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.lg,
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
            marginBottom: spacing.xl,
            fontSize: '20px',
            fontWeight: 700,
          }}
          aria-label="Ana sayfaya git"
        >
          <span  style={{ fontSize: '32px' }}><img
            src="/logo-kitap.png"
            alt=""
            style={{ height: '40px', width: 'auto' }}
            aria-hidden="true"
          /></span>
          Kitaphane
        </Link>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: spacing.xl,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Giriş Yap
        </h1>

        {/* Error Alert */}
        {error && (
          <div style={{ marginBottom: spacing.lg }}>
            <Alert variant="error" dismissible onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            backgroundColor: colors.bgLight,
            color: colors.white,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xl,
            fontWeight: 500,
            fontSize: '15px',
            transition: `all ${transitions.normal}`,
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = colors.cardHover;
              e.currentTarget.style.borderColor = colors.borderLight;
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = colors.bgLight;
              e.currentTarget.style.borderColor = colors.border;
            }
          }}
          aria-label="Google ile giriş yap"
        >
          <GoogleIcon />
          Google ile Giriş Yap
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: spacing.xl,
          }}
          role="separator"
        >
          <div
            style={{
              flex: 1,
              height: '1px',
              backgroundColor: colors.border,
            }}
          />
          <span
            style={{
              padding: `0 ${spacing.lg}`,
              color: colors.gray,
              fontSize: '14px',
            }}
          >
            veya e-posta ile
          </span>
          <div
            style={{
              flex: 1,
              height: '1px',
              backgroundColor: colors.border,
            }}
          />
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} id="login-form">
          <Input
            type="email"
            label="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@eposta.com"
            leftIcon={<EmailIcon />}
            required
            autoComplete="email"
          />

          <Input
            type="password"
            label="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<LockIcon />}
            required
            autoComplete="current-password"
          />

          {/* Forgot Password Link */}
          <div
            style={{
              textAlign: 'right',
              marginBottom: spacing.lg,
              marginTop: `-${spacing.sm}`,
            }}
          >
            <Link
              href="/forgot-password"
              style={{
                color: colors.gray,
                fontSize: '14px',
                textDecoration: 'none',
                transition: `color ${transitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.gray;
              }}
            >
              Şifremi unuttum
            </Link>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              boxShadow: shadows.glow,
            }}
          >
            Giriş Yap
          </Button>
        </form>

        {/* Register Link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: spacing.xl,
            color: colors.gray,
            fontSize: '15px',
          }}
        >
          Hesabın yok mu?{' '}
          <Link
            href="/register"
            style={{
              color: colors.primaryLight,
              fontWeight: 600,
              textDecoration: 'none',
              transition: `color ${transitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.primaryLight;
            }}
          >
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}
