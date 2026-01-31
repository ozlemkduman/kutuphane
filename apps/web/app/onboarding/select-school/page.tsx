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

export default function SelectSchoolPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, getToken, refreshProfile } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Ogrenci bilgileri
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [studentNumber, setStudentNumber] = useState('');

  // Redirect if not logged in or already has school
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && profile) {
      // If user already has a school, redirect to books
      if (profile.schoolId) {
        router.push('/books');
        return;
      }
      // If user is not a MEMBER, redirect appropriately
      if (profile.role === 'DEVELOPER') {
        router.push('/developer');
        return;
      }
      if (profile.role === 'ADMIN') {
        router.push('/books');
        return;
      }
    }
  }, [authLoading, user, profile, router]);

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
          setError('Okullar yüklenirken bir hata oluştu');
        }
      } catch (err) {
        setError('Okullar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Filter schools based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSchools(schools);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.address?.toLowerCase().includes(query)
    );
    setFilteredSchools(filtered);
  }, [searchQuery, schools]);

  const validateForm = (): boolean => {
    if (!selectedSchool) {
      setError('Lutfen bir okul secin');
      return false;
    }
    if (!className.trim()) {
      setError('Sinif bilgisi zorunludur');
      return false;
    }
    if (!section.trim()) {
      setError('Sube bilgisi zorunludur');
      return false;
    }
    if (!studentNumber.trim()) {
      setError('Okul numarasi zorunludur');
      return false;
    }
    if (!/^[0-9]+$/.test(studentNumber.trim())) {
      setError('Okul numarasi sadece rakam icermelidir');
      return false;
    }
    return true;
  };

  const handleSelectSchool = async () => {
    if (!validateForm()) return;

    setError('');
    setSelecting(true);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/select-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolId: selectedSchool,
          className: className.trim(),
          section: section.trim().toUpperCase(),
          studentNumber: studentNumber.trim(),
        }),
      });

      if (response.ok) {
        // Refresh profile and redirect to pending approval
        await refreshProfile();
        router.push('/pending-approval');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'Okul seçilemedi');
      }
    } catch (err) {
      setError('Okul seçilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSelecting(false);
    }
  };

  // Show loading while checking auth
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
        padding: spacing.xl,
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
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
            fontWeight: 'bold',
          }}
        >
          <img
            src="/logo-kitap.png"
            alt=""
            style={{ height: '48px', width: 'auto' }}
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
            marginBottom: spacing['2xl'],
          }}
        >
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
            1
          </div>
          <div
            style={{
              width: '60px',
              height: '2px',
              backgroundColor: colors.border,
            }}
          />
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: colors.card,
              border: `2px solid ${colors.border}`,
              color: colors.gray,
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
            Okulunuzu Seçin
          </h1>
          <p style={{ color: colors.gray, fontSize: '16px' }}>
            Kütüphaneye erişmek için okulunuzu seçmeniz gerekmektedir.
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

        {/* Search */}
        <div style={{ marginBottom: spacing.xl }}>
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
            marginBottom: spacing['2xl'],
          }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={140} />
              ))
            : filteredSchools.map((school) => (
                <div
                  key={school.id}
                  onClick={() => setSelectedSchool(school.id)}
                  style={{
                    backgroundColor:
                      selectedSchool === school.id ? colors.primary : colors.card,
                    border: `2px solid ${
                      selectedSchool === school.id ? colors.primary : colors.border
                    }`,
                    borderRadius: borderRadius.lg,
                    padding: spacing.xl,
                    cursor: 'pointer',
                    transition: `all ${transitions.normal}`,
                    position: 'relative',
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedSchool === school.id}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSchool(school.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSchool !== school.id) {
                      e.currentTarget.style.borderColor = colors.borderLight;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSchool !== school.id) {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Selected Indicator */}
                  {selectedSchool === school.id && (
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
                        selectedSchool === school.id
                          ? 'rgba(255,255,255,0.2)'
                          : colors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: spacing.md,
                      color:
                        selectedSchool === school.id
                          ? colors.white
                          : colors.primary,
                    }}
                  >
                    {school.logo ? (
                      <img
                        src={school.logo}
                        alt=""
                        style={{
                          width: '32px',
                          height: '32px',
                          objectFit: 'contain',
                        }}
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
                      color: selectedSchool === school.id ? colors.white : colors.white,
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
                          selectedSchool === school.id
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
        {!loading && filteredSchools.length === 0 && (
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

        {/* Student Information - shown when school is selected */}
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
            <h3
              style={{
                color: colors.white,
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: spacing.lg,
                marginTop: 0,
              }}
            >
              Ogrenci Bilgileri
            </h3>
            <p
              style={{
                color: colors.gray,
                fontSize: '14px',
                marginBottom: spacing.lg,
              }}
            >
              Okul yoneticinizin sizi onaylayabilmesi icin asagidaki bilgileri doldurun.
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
                label="Sinif"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="9, 10, 11..."
                required
              />
              <Input
                type="text"
                label="Sube"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="A, B, C..."
                required
              />
              <Input
                type="text"
                label="Okul Numarasi"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="12345"
                required
              />
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleSelectSchool}
            disabled={!selectedSchool || !className.trim() || !section.trim() || !studentNumber.trim()}
            loading={selecting}
            size="lg"
            style={{
              minWidth: '200px',
              background: selectedSchool && className.trim() && section.trim() && studentNumber.trim()
                ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`
                : undefined,
              boxShadow: selectedSchool && className.trim() && section.trim() && studentNumber.trim() ? shadows.glow : undefined,
            }}
          >
            Devam Et
          </Button>
        </div>
      </div>
    </div>
  );
}
