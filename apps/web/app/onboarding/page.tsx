'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, spacing, transitions, shadows } from '@/lib/theme';

interface School {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
}

// Search Icon
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
  </svg>
);

// School Icon
const SchoolIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.584 2.376a.75.75 0 01.832 0l9 6a.75.75 0 11-.832 1.248L12 3.901 3.416 9.624a.75.75 0 01-.832-1.248l9-6z" />
    <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 010 1.5H3a.75.75 0 010-1.5h.75v-9.918a.75.75 0 01.634-.74A49.109 49.109 0 0112 9c2.59 0 5.134.202 7.616.592a.75.75 0 01.634.74zm-7.5 2.418a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75zm3-.75a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0v-6.75a.75.75 0 01.75-.75zM9 12.75a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75z" clipRule="evenodd" />
  </svg>
);

// Check Icon
const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, profileLoading, getToken, refreshProfile } = useAuth();

  // School data
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // User info
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'student' | 'teacher'>('student');

  // Student fields
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [studentNumber, setStudentNumber] = useState('');

  // Teacher fields
  const [teacherCode, setTeacherCode] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Guard: redirect based on auth state
  useEffect(() => {
    if (authLoading || profileLoading) return;

    // No Firebase user → login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Has DB profile → redirect based on status
    if (profile) {
      if (profile.status === 'APPROVED' && profile.schoolId) {
        router.replace('/books');
        return;
      }
      if (profile.status === 'PENDING') {
        router.replace('/pending-approval');
        return;
      }
      if (profile.role === 'DEVELOPER') {
        router.replace('/developer');
        return;
      }
    }
  }, [authLoading, profileLoading, user, profile, router]);

  // Pre-fill name from Firebase displayName
  useEffect(() => {
    if (user?.displayName && !name) {
      setName(user.displayName);
    }
  }, [user]);

  // Pre-select school from localStorage (set by /register/[schoolSlug] redirect)
  useEffect(() => {
    const savedSlug = localStorage.getItem('onboarding_school_slug');
    if (savedSlug && schools.length > 0) {
      const school = schools.find(s => s.slug === savedSlug);
      if (school) {
        setSelectedSchool(school);
        localStorage.removeItem('onboarding_school_slug');
      }
    }
  }, [schools]);

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/public`);
        if (response.ok) {
          const data = await response.json();
          setSchools(data);
          setFilteredSchools(data);
        } else {
          setError('Okullar yüklenirken bir hata oluştu.');
        }
      } catch {
        setError('Okullar yüklenirken bir hata oluştu.');
      } finally {
        setSchoolsLoading(false);
      }
    };
    fetchSchools();
  }, []);

  // Filter schools
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSchools(schools);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredSchools(
      schools.filter(
        (s) => s.name.toLowerCase().includes(query) || s.address?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, schools]);

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) {
      setError('Ad soyad gereklidir.');
      return;
    }
    if (!selectedSchool) {
      setError('Lütfen bir okul seçin.');
      return;
    }

    if (userType === 'student') {
      if (!className.trim()) {
        setError('Sınıf bilgisi zorunludur.');
        return;
      }
      if (!section.trim()) {
        setError('Şube bilgisi zorunludur.');
        return;
      }
      if (!studentNumber.trim()) {
        setError('Okul numarası zorunludur.');
        return;
      }
      if (!/^[0-9]+$/.test(studentNumber.trim())) {
        setError('Okul numarası sadece rakam içermelidir.');
        return;
      }
    } else {
      if (!teacherCode.trim()) {
        setError('Öğretmen kodu zorunludur.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = await getToken();

      const body: Record<string, string> = {
        name: name.trim(),
        email: user!.email!,
        schoolSlug: selectedSchool.slug,
      };

      if (userType === 'teacher') {
        body.teacherCode = teacherCode.trim();
      } else {
        body.className = className.trim();
        body.section = section.trim().toUpperCase();
        body.studentNumber = studentNumber.trim();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await refreshProfile();
        router.push('/pending-approval');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Kayıt yapılamadı. Lütfen tekrar deneyin.');
      }
    } catch {
      setError('Kayıt yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || profileLoading) {
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

  // Don't render if redirect will happen
  if (!user || (profile && profile.status === 'APPROVED' && profile.schoolId)) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        padding: spacing.xl,
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
            fontWeight: 'bold',
          }}
        >
          <img
            src="/logo-kitap.png"
            alt=""
            style={{ height: '48px', width: 'auto' }}
          />
          Bir Kitap Aldım
        </Link>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: colors.white,
              marginBottom: spacing.md,
            }}
          >
            Hoş Geldin! Bilgilerini Tamamla
          </h1>
          <p style={{ color: colors.gray, fontSize: '16px' }}>
            Kütüphaneye erişmek için okul bilgilerini doldurman gerekiyor.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: spacing.lg }}>
            <Alert variant="error" dismissible onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Name Field */}
        <div
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            marginBottom: spacing.xl,
          }}
        >
          <h3
            style={{
              color: colors.white,
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: spacing.lg,
              marginTop: 0,
            }}
          >
            Ad Soyad
          </h3>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adınız Soyadınız"
            required
          />
        </div>

        {/* School Selection */}
        <div style={{ marginBottom: spacing.xl }}>
          <h3
            style={{
              color: colors.white,
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: spacing.lg,
            }}
          >
            Okulunu Seç
          </h3>

          {/* Search */}
          <div style={{ marginBottom: spacing.lg }}>
            <Input
              type="text"
              placeholder="Okul ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<SearchIcon />}
            />
          </div>

          {/* Schools Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            {schoolsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={140} />
                ))
              : filteredSchools.map((school) => (
                  <div
                    key={school.id}
                    onClick={() => setSelectedSchool(school)}
                    style={{
                      backgroundColor:
                        selectedSchool?.id === school.id ? colors.primary : colors.card,
                      border: `2px solid ${
                        selectedSchool?.id === school.id ? colors.primary : colors.border
                      }`,
                      borderRadius: borderRadius.lg,
                      padding: spacing.xl,
                      cursor: 'pointer',
                      transition: `all ${transitions.normal}`,
                      position: 'relative',
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedSchool?.id === school.id}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSchool(school);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSchool?.id !== school.id) {
                        e.currentTarget.style.borderColor = colors.borderLight;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSchool?.id !== school.id) {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {/* Selected Indicator */}
                    {selectedSchool?.id === school.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: spacing.md,
                          right: spacing.md,
                          color: colors.white,
                        }}
                      >
                        <CheckIcon />
                      </div>
                    )}

                    {/* School Icon or Logo */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: borderRadius.md,
                        backgroundColor:
                          selectedSchool?.id === school.id
                            ? 'rgba(255,255,255,0.2)'
                            : colors.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: spacing.md,
                        color:
                          selectedSchool?.id === school.id
                            ? colors.white
                            : colors.primary,
                      }}
                    >
                      {school.logo ? (
                        <img
                          src={school.logo}
                          alt=""
                          style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                      ) : (
                        <SchoolIcon />
                      )}
                    </div>

                    {/* School Name */}
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 600,
                        color: colors.white,
                        marginBottom: spacing.xs,
                      }}
                    >
                      {school.name}
                    </h3>

                    {/* Address */}
                    {school.address && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color:
                            selectedSchool?.id === school.id
                              ? 'rgba(255,255,255,0.8)'
                              : colors.gray,
                          lineHeight: 1.4,
                        }}
                      >
                        {school.address}
                      </p>
                    )}
                  </div>
                ))}
          </div>

          {/* No Results */}
          {!schoolsLoading && filteredSchools.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: spacing['3xl'],
                color: colors.gray,
              }}
            >
              <p style={{ fontSize: '16px', marginBottom: spacing.sm }}>
                Aradığınız okul bulunamadı.
              </p>
              <p style={{ fontSize: '14px' }}>
                Okul yöneticinizle iletişime geçin.
              </p>
            </div>
          )}
        </div>

        {/* Details Form - shown when school is selected */}
        {selectedSchool && (
          <div
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              marginBottom: spacing['2xl'],
            }}
          >
            {/* User Type Toggle */}
            <h3
              style={{
                color: colors.white,
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: spacing.lg,
                marginTop: 0,
              }}
            >
              Kullanıcı Bilgileri
            </h3>

            <div
              style={{
                display: 'flex',
                gap: spacing.md,
                marginBottom: spacing.xl,
              }}
            >
              <button
                onClick={() => setUserType('student')}
                style={{
                  flex: 1,
                  padding: `${spacing.md} ${spacing.lg}`,
                  borderRadius: borderRadius.md,
                  border: `2px solid ${userType === 'student' ? colors.primary : colors.border}`,
                  backgroundColor: userType === 'student' ? colors.primary : 'transparent',
                  color: colors.white,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '15px',
                  transition: `all ${transitions.normal}`,
                }}
              >
                Öğrenci
              </button>
              <button
                onClick={() => setUserType('teacher')}
                style={{
                  flex: 1,
                  padding: `${spacing.md} ${spacing.lg}`,
                  borderRadius: borderRadius.md,
                  border: `2px solid ${userType === 'teacher' ? colors.primary : colors.border}`,
                  backgroundColor: userType === 'teacher' ? colors.primary : 'transparent',
                  color: colors.white,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '15px',
                  transition: `all ${transitions.normal}`,
                }}
              >
                Öğretmen
              </button>
            </div>

            {userType === 'student' ? (
              <>
                <p
                  style={{
                    color: colors.gray,
                    fontSize: '14px',
                    marginBottom: spacing.lg,
                  }}
                >
                  Okul yöneticisinin sizi onaylayabilmesi için aşağıdaki bilgileri doldurun.
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: spacing.lg,
                  }}
                >
                  <Input
                    type="text"
                    label="Sınıf"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="9, 10, 11..."
                    required
                  />
                  <Input
                    type="text"
                    label="Şube"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A, B, C..."
                    required
                  />
                  <Input
                    type="text"
                    label="Okul Numarası"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="12345"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <p
                  style={{
                    color: colors.gray,
                    fontSize: '14px',
                    marginBottom: spacing.lg,
                  }}
                >
                  Öğretmen olarak kayıt olmak için okul yöneticinizden aldığınız kodu girin.
                </p>
                <Input
                  type="text"
                  label="Öğretmen Kodu"
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value)}
                  placeholder="Öğretmen kodu"
                  required
                />
              </>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSchool || !name.trim()}
            loading={submitting}
            size="lg"
            style={{
              minWidth: '200px',
              background:
                selectedSchool && name.trim()
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`
                  : undefined,
              boxShadow: selectedSchool && name.trim() ? shadows.glow : undefined,
            }}
          >
            Tamamla
          </Button>
        </div>
      </div>
    </div>
  );
}
