'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Token cache settings
const TOKEN_CACHE_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
const PROFILE_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// User profile from database
export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: 'DEVELOPER' | 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isMainAdmin: boolean;
  schoolId: string | null;
  school: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  // Ogrenci bilgileri
  className: string | null;
  section: string | null;
  studentNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  // Firebase user
  user: User | null;

  // Database profile
  profile: UserProfile | null;

  // Loading states
  loading: boolean;
  profileLoading: boolean;

  // Error state
  error: string | null;

  // Token management
  getToken: () => Promise<string | null>;

  // Auth actions
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;

  // State checks
  isAuthenticated: boolean;
  needsSchoolSelection: boolean;
  needsOnboarding: boolean;
  isPendingApproval: boolean;
  isRejected: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  error: null,
  getToken: async () => null,
  signOut: async () => {},
  refreshProfile: async () => {},
  clearError: () => {},
  isAuthenticated: false,
  needsSchoolSelection: false,
  needsOnboarding: false,
  isPendingApproval: false,
  isRejected: false,
});

interface TokenCache {
  token: string;
  expiresAt: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Token cache ref to persist across renders
  const tokenCache = useRef<TokenCache | null>(null);
  const profileFetchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get token with caching
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    const now = Date.now();

    // Check if cached token is still valid (with buffer)
    if (
      tokenCache.current &&
      tokenCache.current.expiresAt > now + TOKEN_CACHE_BUFFER_MS
    ) {
      return tokenCache.current.token;
    }

    try {
      // Get fresh token
      const tokenResult = await user.getIdTokenResult(true);
      const token = tokenResult.token;
      const expiresAt = new Date(tokenResult.expirationTime).getTime();

      // Cache it
      tokenCache.current = { token, expiresAt };

      return token;
    } catch {
      setError('Oturum bilgisi alınamadı');
      return null;
    }
  }, [user]);

  // Fetch user profile from API
  const fetchProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        // User exists in Firebase but not in database - needs registration
        setProfile(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Profil bilgisi alınamadı');
      }
    } catch {
      setError('Profil bilgisi alınamadı');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Refresh profile manually
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  // Sign out
  const handleSignOut = useCallback(async () => {
    try {
      await auth.signOut();
      setProfile(null);
      tokenCache.current = null;
      setError(null);
    } catch {
      setError('Çıkış yapılamadı');
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User logged in - fetch profile first, then update states
        setUser(firebaseUser);

        // Fetch profile and wait for it to complete before setting loading to false
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setProfile(data);
          } else if (response.status === 404) {
            setProfile(null);
          }
        } catch {
          setProfile(null);
        }

        // Set up periodic profile refresh
        if (profileFetchTimeout.current) {
          clearInterval(profileFetchTimeout.current);
        }
        profileFetchTimeout.current = setInterval(() => {
          fetchProfile(firebaseUser);
        }, PROFILE_REFRESH_INTERVAL_MS);
      } else {
        // User logged out
        setUser(null);
        setProfile(null);
        tokenCache.current = null;

        if (profileFetchTimeout.current) {
          clearInterval(profileFetchTimeout.current);
          profileFetchTimeout.current = null;
        }
      }

      // Only set loading to false AFTER everything is loaded
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileFetchTimeout.current) {
        clearInterval(profileFetchTimeout.current);
      }
    };
  }, [fetchProfile]);

  // Computed values
  const isAuthenticated = !!user && !!profile;

  // User needs school selection if they are a MEMBER without a school
  const needsSchoolSelection =
    !!user &&
    !!profile &&
    profile.role === 'MEMBER' &&
    !profile.schoolId;

  // User needs onboarding if they are authenticated but haven't completed setup
  const needsOnboarding = needsSchoolSelection;

  // User is pending approval
  const isPendingApproval =
    !!user &&
    !!profile &&
    profile.role === 'MEMBER' &&
    profile.status === 'PENDING';

  // User is rejected
  const isRejected =
    !!user &&
    !!profile &&
    profile.role === 'MEMBER' &&
    profile.status === 'REJECTED';

  const value: AuthContextType = {
    user,
    profile,
    loading,
    profileLoading,
    error,
    getToken,
    signOut: handleSignOut,
    refreshProfile,
    clearError,
    isAuthenticated,
    needsSchoolSelection,
    needsOnboarding,
    isPendingApproval,
    isRejected,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for requiring authentication
export const useRequireAuth = (redirectTo: string = '/login') => {
  const auth = useAuth();
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  useEffect(() => {
    if (!auth.loading && !auth.user && router) {
      router.push(redirectTo);
    }
  }, [auth.loading, auth.user, router, redirectTo]);

  return auth;
};

// Hook for requiring specific role
export const useRequireRole = (
  allowedRoles: ('DEVELOPER' | 'ADMIN' | 'MEMBER')[],
  redirectTo: string = '/books'
) => {
  const auth = useAuth();
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  useEffect(() => {
    if (!auth.loading && auth.profile && router) {
      if (!allowedRoles.includes(auth.profile.role)) {
        router.push(redirectTo);
      }
    }
  }, [auth.loading, auth.profile, router, allowedRoles, redirectTo]);

  return auth;
};

export default AuthContext;
