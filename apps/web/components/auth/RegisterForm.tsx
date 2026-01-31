'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
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

// User Icon Component
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
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

// School Icon Component
const SchoolIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
  </svg>
);

// Number Icon Component
const NumberIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
  </svg>
);

// Error messages mapping
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullaniliyor.',
    'auth/invalid-email': 'Gecersiz e-posta adresi.',
    'auth/weak-password': 'Sifre en az 6 karakter olmalidir.',
    'auth/operation-not-allowed': 'E-posta/sifre ile kayit su an devre disi.',
    'auth/network-request-failed': 'Internet baglantinizi kontrol edin.',
    'auth/popup-closed-by-user': 'Google kayit penceresi kapatildi.',
    'auth/too-many-requests': 'Cok fazla deneme yapildi. Lutfen daha sonra tekrar deneyin.',
  };

  return errorMessages[errorCode] || 'Kayit yapilirken bir hata olustu. Lutfen tekrar deneyin.';
};

// Password strength checker
const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  let strength = 0;
  if (password.length >= 6) strength += 1;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  if (strength <= 1) return { strength, label: 'Zayif', color: colors.error };
  if (strength <= 2) return { strength, label: 'Orta', color: colors.warning };
  if (strength <= 3) return { strength, label: 'Iyi', color: colors.primaryLight };
  return { strength, label: 'Guclu', color: colors.success };
};

interface School {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface RegisterFormProps {
  school?: School | null;
  schoolSlug?: string;
}

export function RegisterForm({ school: preselectedSchool, schoolSlug }: RegisterFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  const passwordStrength = getPasswordStrength(password);

  // Okullari yukle
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/public`);
        if (res.ok) {
          const data = await res.json();
          setSchools(data);

          // Eger preselected school varsa sec
          if (preselectedSchool) {
            setSelectedSchoolId(preselectedSchool.id);
          }
        }
      } catch {
        toast.error('Okullar yuklenemedi');
      } finally {
        setSchoolsLoading(false);
      }
    };
    fetchSchools();
  }, [preselectedSchool]);

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

  const registerUser = async (token: string, userName: string, userEmail: string) => {
    const body: any = {
      name: userName,
      email: userEmail,
    };

    // Okul seciliyse okul bilgilerini ekle
    if (selectedSchool) {
      body.schoolSlug = selectedSchool.slug;
      body.className = className.trim();
      body.section = section.trim().toUpperCase();
      body.studentNumber = studentNumber.trim();
    }

    const registerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!registerRes.ok) {
      const data = await registerRes.json().catch(() => ({}));
      throw new Error(data.message || 'Kayit yapilamadi');
    }

    return registerRes.json();
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      toast.error('Ad soyad zorunludur');
      return false;
    }

    if (!email.trim()) {
      toast.error('E-posta zorunludur');
      return false;
    }

    if (password.length < 6) {
      toast.error('Sifre en az 6 karakter olmalidir');
      return false;
    }

    if (!selectedSchoolId) {
      toast.error('Lutfen bir okul secin');
      return false;
    }

    if (!className.trim()) {
      toast.error('Sinif bilgisi zorunludur');
      return false;
    }

    if (!section.trim()) {
      toast.error('Sube bilgisi zorunludur');
      return false;
    }

    if (!studentNumber.trim()) {
      toast.error('Okul numarasi zorunludur');
      return false;
    }

    if (!/^[0-9]+$/.test(studentNumber.trim())) {
      toast.error('Okul numarasi sadece rakam icermelidir');
      return false;
    }

    return true;
  };

  // Yetim Firebase hesabini temizle (reddedilmis kullanici icin)
  const cleanupOrphanedAccount = async (userEmail: string): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleanup-orphaned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.cleaned === true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      let result;

      try {
        // Oncelikle yeni kullanici olusturmaya calis
        result = await createUserWithEmailAndPassword(auth, email, password);
      } catch (createErr: any) {
        // Eger e-posta zaten kullaniliyorsa
        if (createErr.code === 'auth/email-already-in-use') {
          // Yetim hesap olabilir mi kontrol et (reddedilmis kullanici)
          const cleaned = await cleanupOrphanedAccount(email);

          if (cleaned) {
            // Yetim hesap temizlendi, tekrar kayit olmaya calis
            try {
              result = await createUserWithEmailAndPassword(auth, email, password);
            } catch (retryErr: any) {
              toast.error(getErrorMessage(retryErr.code || 'auth/email-already-in-use'));
              setLoading(false);
              return;
            }
          } else {
            // Yetim hesap degil - gercekten kullanilan bir e-posta
            toast.error('Bu e-posta adresi zaten kayitli. Lutfen giris yapin veya farkli bir e-posta kullanin.');
            setLoading(false);
            return;
          }
        } else {
          throw createErr;
        }
      }

      const token = await result.user.getIdToken();
      await registerUser(token, name, email);

      toast.success('Kayit basarili! Onay bekleniyor...');
      router.push('/pending-approval');
    } catch (err: any) {
      if (err.code) {
        toast.error(getErrorMessage(err.code));
      } else {
        toast.error(err.message || 'Kayit yapilirken bir hata olustu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    // Validation
    if (!selectedSchoolId) {
      toast.error('Lutfen once bir okul secin');
      return;
    }

    if (!className.trim() || !section.trim() || !studentNumber.trim()) {
      toast.error('Lutfen tum ogrenci bilgilerini doldurun');
      return;
    }

    if (!/^[0-9]+$/.test(studentNumber.trim())) {
      toast.error('Okul numarasi sadece rakam icermelidir');
      return;
    }

    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      await registerUser(
        token,
        result.user.displayName || name || 'Isimsiz',
        result.user.email || ''
      );

      toast.success('Kayit basarili! Onay bekleniyor...');
      router.push('/pending-approval');
    } catch (err: any) {
      if (err.code) {
        toast.error(getErrorMessage(err.code));
      } else {
        toast.error(err.message || 'Kayit yapilirken bir hata olustu');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
          marginBottom: spacing.lg,
          fontSize: '20px',
          fontWeight: 700,
        }}
        aria-label="Ana sayfaya git"
      >
        <span style={{ fontSize: '32px' }}>📚</span>
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
        Kayit Ol
      </h1>

      {/* Register Form */}
      <form onSubmit={handleRegister} id="register-form">
        <Input
          type="text"
          label="Ad Soyad"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ahmet Yilmaz"
          leftIcon={<UserIcon />}
          required
          autoComplete="name"
        />

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
          label="Sifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="En az 6 karakter"
          leftIcon={<LockIcon />}
          required
          autoComplete="new-password"
        />

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div style={{ marginBottom: spacing.lg, marginTop: `-${spacing.sm}` }}>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '4px',
              }}
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor:
                      level <= passwordStrength.strength ? passwordStrength.color : colors.border,
                    transition: `background-color ${transitions.fast}`,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontSize: '12px',
                color: passwordStrength.color,
              }}
            >
              Sifre gucu: {passwordStrength.label}
            </span>
          </div>
        )}

        {/* Okul ve Ogrenci Bilgileri */}
        <div
          style={{
            marginTop: spacing.lg,
            marginBottom: spacing.md,
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.md }}>
            Okul ve Ogrenci Bilgileri
          </p>
        </div>

        {/* Okul Secimi */}
        <div style={{ marginBottom: spacing.lg }}>
          <label
            style={{
              display: 'block',
              color: colors.gray,
              fontSize: '14px',
              marginBottom: spacing.sm,
              fontWeight: 500,
            }}
          >
            Okul *
          </label>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.gray,
                pointerEvents: 'none',
              }}
            >
              <SchoolIcon />
            </div>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              disabled={schoolsLoading || !!schoolSlug}
              style={{
                width: '100%',
                padding: `${spacing.md} ${spacing.md} ${spacing.md} 44px`,
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                color: selectedSchoolId ? colors.white : colors.gray,
                fontSize: '15px',
                cursor: schoolsLoading ? 'not-allowed' : 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px',
              }}
            >
              <option value="">
                {schoolsLoading ? 'Yukleniyor...' : 'Okul secin'}
              </option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ogrenci Bilgileri - Okul secildiyse goster */}
        {selectedSchoolId && (
          <>
            <div style={{ display: 'flex', gap: spacing.md }}>
              <div style={{ flex: 1 }}>
                <Input
                  type="text"
                  label="Sinif *"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="9, 10, 11..."
                  leftIcon={<SchoolIcon />}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <Input
                  type="text"
                  label="Sube *"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="A, B, C..."
                  leftIcon={<SchoolIcon />}
                  required
                />
              </div>
            </div>

            <Input
              type="text"
              label="Okul Numarasi *"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="12345"
              leftIcon={<NumberIcon />}
              required
            />
          </>
        )}

        <Button
          type="submit"
          loading={loading}
          fullWidth
          size="lg"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
            boxShadow: shadows.glow,
            marginTop: spacing.md,
          }}
        >
          Kayit Ol
        </Button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: `${spacing.xl} 0`,
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
          veya
        </span>
        <div
          style={{
            flex: 1,
            height: '1px',
            backgroundColor: colors.border,
          }}
        />
      </div>

      {/* Google Register Button */}
      <button
        onClick={handleGoogleRegister}
        disabled={loading}
        type="button"
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
        aria-label="Google ile kayit ol"
      >
        <GoogleIcon />
        Google ile Kayit Ol
      </button>

      {/* Info about approval process */}
      <p
        style={{
          textAlign: 'center',
          marginTop: spacing.xl,
          color: colors.primaryLight,
          fontSize: '13px',
          padding: spacing.sm,
          backgroundColor: `${colors.primaryLight}15`,
          borderRadius: borderRadius.sm,
        }}
      >
        Kayit sonrasi okul yoneticiniz bilgilerinizi onaylayacaktir.
      </p>

      {/* Terms Notice */}
      <p
        style={{
          textAlign: 'center',
          marginTop: spacing.lg,
          color: colors.darkGray,
          fontSize: '12px',
          lineHeight: 1.5,
        }}
      >
        Kayit olarak{' '}
        <Link
          href="/terms"
          style={{ color: colors.gray, textDecoration: 'underline' }}
        >
          Kullanim Kosullari
        </Link>
        {' '}ve{' '}
        <Link
          href="/privacy"
          style={{ color: colors.gray, textDecoration: 'underline' }}
        >
          Gizlilik Politikasi
        </Link>
        &apos;ni kabul etmis olursunuz.
      </p>

      {/* Login Link */}
      <p
        style={{
          textAlign: 'center',
          marginTop: spacing.lg,
          color: colors.gray,
          fontSize: '15px',
        }}
      >
        Zaten hesabin var mi?{' '}
        <Link
          href="/login"
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
          Giris Yap
        </Link>
      </p>
    </div>
  );
}
