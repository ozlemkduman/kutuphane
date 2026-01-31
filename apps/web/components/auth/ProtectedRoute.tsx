'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/theme';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('DEVELOPER' | 'ADMIN' | 'MEMBER')[];
  requireSchool?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

// Loading spinner component
const LoadingSpinner = () => (
  <div
    style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
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
    <p style={{ color: colors.gray, fontSize: '14px' }}>Yükleniyor...</p>
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export const ProtectedRoute = ({
  children,
  allowedRoles,
  requireSchool = false,
  redirectTo,
  fallback,
}: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, profileLoading, isAuthenticated, needsSchoolSelection } = useAuth();

  useEffect(() => {
    // Wait until loading is complete
    if (loading || profileLoading) return;

    // Not logged in - redirect to login
    if (!user) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // User exists but no profile (needs registration)
    if (user && !profile) {
      router.push('/register');
      return;
    }

    // Check role requirements
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      router.push(redirectTo || '/books');
      return;
    }

    // Check school requirement (only for MEMBER role)
    if (requireSchool && profile?.role === 'MEMBER' && !profile?.schoolId) {
      // Don't redirect if we're already on onboarding
      if (!pathname.startsWith('/onboarding')) {
        router.push('/onboarding/select-school');
      }
      return;
    }

    // If user needs school selection but is not on onboarding page
    if (needsSchoolSelection && !pathname.startsWith('/onboarding')) {
      router.push('/onboarding/select-school');
      return;
    }
  }, [
    loading,
    profileLoading,
    user,
    profile,
    allowedRoles,
    requireSchool,
    needsSchoolSelection,
    pathname,
    router,
    redirectTo,
  ]);

  // Show loading while checking auth
  if (loading || profileLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Not authenticated - show loading while redirecting
  if (!user || !profile) {
    return fallback || <LoadingSpinner />;
  }

  // Role check failed - show loading while redirecting
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return fallback || <LoadingSpinner />;
  }

  // School requirement not met - show loading while redirecting
  if (requireSchool && profile.role === 'MEMBER' && !profile.schoolId && !pathname.startsWith('/onboarding')) {
    return fallback || <LoadingSpinner />;
  }

  // All checks passed - render children
  return <>{children}</>;
};

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hooks for checking permissions in components
export const useHasRole = (allowedRoles: ('DEVELOPER' | 'ADMIN' | 'MEMBER')[]) => {
  const { profile, loading } = useAuth();

  if (loading || !profile) return false;
  return allowedRoles.includes(profile.role);
};

export const useIsAdmin = () => useHasRole(['ADMIN', 'DEVELOPER']);
export const useIsDeveloper = () => useHasRole(['DEVELOPER']);

export default ProtectedRoute;
