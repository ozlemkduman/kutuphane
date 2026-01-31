'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/lib/theme';
import Link from 'next/link';

interface School {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export default function SchoolRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, profile } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const schoolSlug = params.schoolSlug as string;

  // Fetch school info
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/public`);
        if (res.ok) {
          const schools: School[] = await res.json();
          const foundSchool = schools.find((s) => s.slug === schoolSlug);
          if (foundSchool) {
            setSchool(foundSchool);
          } else {
            setError('Okul bulunamadi. Lutfen gecerli bir okul linki kullanin.');
          }
        } else {
          setError('Okul bilgileri alinamadi.');
        }
      } catch {
        setError('Baglanti hatasi. Lutfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    if (schoolSlug) {
      fetchSchool();
    }
  }, [schoolSlug]);

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

  // Loading state
  if (authLoading || loading) {
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

  // Error state - school not found
  if (error) {
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
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: spacing.lg }}>🏫</div>
          <Alert variant="error" style={{ marginBottom: spacing.xl }}>
            {error}
          </Alert>
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
            <Link href="/register">
              <Button variant="outline">Normal Kayit</Button>
            </Link>
            <Link href="/">
              <Button variant="primary">Ana Sayfa</Button>
            </Link>
          </div>
        </div>
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
      <RegisterForm school={school} schoolSlug={schoolSlug} />
    </div>
  );
}
