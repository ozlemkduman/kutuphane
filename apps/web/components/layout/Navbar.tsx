'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { colors, borderRadius, shadows, transitions, zIndex, spacing } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Bell icon SVG component
const BellIcon = ({ hasNotifications }: { hasNotifications?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    {hasNotifications && <circle cx="18" cy="5" r="3" fill={colors.error} stroke={colors.error} />}
  </svg>
);

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

// Role-based navigation items
const getNavItems = (role: 'DEVELOPER' | 'ADMIN' | 'MEMBER' | null): NavItem[] => {
  if (!role) return [];

  switch (role) {
    case 'DEVELOPER':
      // Developer only sees developer panel
      return [
        { label: 'Geliştirici Paneli', href: '/developer', icon: '🔧' },
      ];
    case 'ADMIN':
      // Admin sees books, favorites, my loans, admin panel, profile
      return [
        { label: 'Kitaplar', href: '/books', icon: '📚' },
        { label: 'Favorilerim', href: '/favorites', icon: '❤️' },
        { label: 'Okuma Geçmişim', href: '/my-loans', icon: '📖' },
        { label: 'Yönetim Paneli', href: '/admin', icon: '⚙️' },
        { label: 'Profilim', href: '/profile', icon: '👤' },
      ];
    case 'MEMBER':
    default:
      // Member sees books, favorites, my loans, profile
      return [
        { label: 'Kitaplar', href: '/books', icon: '📚' },
        { label: 'Favorilerim', href: '/favorites', icon: '❤️' },
        { label: 'Okuma Geçmişim', href: '/my-loans', icon: '📖' },
        { label: 'Profilim', href: '/profile', icon: '👤' },
      ];
  }
};

// Role badge config
const getRoleBadge = (role: 'DEVELOPER' | 'ADMIN' | 'MEMBER') => {
  switch (role) {
    case 'DEVELOPER':
      return { label: 'Geliştirici', variant: 'developer' as const };
    case 'ADMIN':
      return { label: 'Yönetici', variant: 'admin' as const };
    case 'MEMBER':
    default:
      return { label: 'Üye', variant: 'member' as const };
  }
};

export interface NavbarProps {
  transparent?: boolean;
}

export const Navbar = ({ transparent = false }: NavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, profile, getToken } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    if (!user || !profile || profile.role === 'DEVELOPER') return;

    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {
      // Ignore errors
    }
  }, [user, profile, getToken]);

  // Fetch on mount and periodically
  useEffect(() => {
    if (user && profile && profile.role !== 'DEVELOPER') {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Her 30 saniyede bir kontrol
      return () => clearInterval(interval);
    }
  }, [user, profile, fetchUnreadCount]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch {
      // Logout failed silently
    }
  };

  const showBackground = scrolled || !transparent;
  const navItems = getNavItems(profile?.role || null);
  const roleBadge = profile ? getRoleBadge(profile.role) : null;

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: zIndex.fixed,
    backgroundColor: showBackground ? colors.card : 'transparent',
    borderBottom: showBackground ? `1px solid ${colors.border}` : 'none',
    boxShadow: showBackground ? shadows.sm : 'none',
    transition: `all ${transitions.normal}`,
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: `${spacing.md} ${spacing.xl}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    textDecoration: 'none',
    color: colors.white,
    fontSize: '22px',
    fontWeight: 700,
  };

  const desktopNavStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
  };

  const navLinksStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  };

  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    color: isActive ? colors.primary : colors.grayLight,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    backgroundColor: isActive ? `${colors.primary}15` : 'transparent',
    transition: `all ${transitions.fast}`,
  });

  const userInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  };

  const mobileMenuButtonStyle: React.CSSProperties = {
    display: 'none',
    padding: spacing.sm,
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.white,
    cursor: 'pointer',
  };

  const mobileMenuStyle: React.CSSProperties = {
    position: 'fixed',
    top: '64px',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    display: mobileMenuOpen ? 'flex' : 'none',
    flexDirection: 'column',
    zIndex: zIndex.fixed - 1,
    overflowY: 'auto',
  };

  const mobileNavLinksStyle: React.CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  };

  return (
    <>
      <nav style={navStyle} role="navigation" aria-label="Ana navigasyon">
        <div style={containerStyle}>
          {/* Logo */}
          <Link href={profile?.role === 'DEVELOPER' ? '/developer' : '/'} style={logoStyle}>
            <span style={{ fontSize: '28px' }}>📚</span>
            <span style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Kitaphane
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div style={desktopNavStyle} className="desktop-nav">
            {!loading && user && profile && (
              <ul style={navLinksStyle}>
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      style={navLinkStyle(pathname === item.href || pathname.startsWith(item.href + '/'))}
                      aria-current={pathname === item.href ? 'page' : undefined}
                      onMouseEnter={(e) => {
                        if (pathname !== item.href && !pathname.startsWith(item.href + '/')) {
                          e.currentTarget.style.color = colors.white;
                          e.currentTarget.style.backgroundColor = `${colors.primary}10`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== item.href && !pathname.startsWith(item.href + '/')) {
                          e.currentTarget.style.color = colors.grayLight;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* User Info & Actions */}
            <div style={userInfoStyle}>
              {loading ? (
                <div
                  style={{
                    width: '100px',
                    height: '36px',
                    backgroundColor: colors.bg,
                    borderRadius: borderRadius.md,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ) : user && profile ? (
                <>
                  {/* Notification Bell - Only for non-developers */}
                  {profile.role !== 'DEVELOPER' && (
                    <Link
                      href="/profile?tab=notifications"
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: unreadCount > 0 ? colors.primary : colors.grayLight,
                        padding: spacing.sm,
                        borderRadius: borderRadius.md,
                        transition: `all ${transitions.fast}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primary}15`;
                        e.currentTarget.style.color = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = unreadCount > 0 ? colors.primary : colors.grayLight;
                      }}
                      aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ''}`}
                    >
                      <BellIcon hasNotifications={unreadCount > 0} />
                      {unreadCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          minWidth: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.error,
                          color: colors.white,
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '50%',
                          padding: '0 4px',
                        }}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Badge variant={roleBadge?.variant || 'default'} size="sm">
                    {roleBadge?.label}
                  </Badge>
                  <span style={{ color: colors.grayLight, fontSize: '13px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.name}
                  </span>
                  <Link href="/settings">
                    <Button variant="ghost" size="sm">
                      Ayarlar
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Çıkış
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      Kayıt Ol
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              style={mobileMenuButtonStyle}
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={mobileMenuOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div style={mobileMenuStyle} className="mobile-menu">
        {!loading && user && profile && (
          <>
            {/* User Info */}
            <div style={{
              padding: spacing.lg,
              marginBottom: spacing.lg,
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: colors.white,
                fontWeight: 600,
              }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: colors.white, fontWeight: 600, margin: 0 }}>{profile.name}</p>
                <p style={{ color: colors.gray, fontSize: '13px', margin: 0 }}>{profile.email}</p>
              </div>
              <Badge variant={roleBadge?.variant || 'default'} size="sm">
                {roleBadge?.label}
              </Badge>
            </div>

            {/* Nav Links */}
            <ul style={mobileNavLinksStyle}>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                      color: pathname === item.href || pathname.startsWith(item.href + '/') ? colors.primary : colors.white,
                      backgroundColor: pathname === item.href || pathname.startsWith(item.href + '/') ? `${colors.primary}15` : colors.card,
                      borderRadius: borderRadius.lg,
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: 500,
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <span style={{ fontSize: '20px' }}>{item.icon}</span>}
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Notifications Link - Mobile (non-developers only) */}
              {profile.role !== 'DEVELOPER' && (
                <li>
                  <Link
                    href="/profile?tab=notifications"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                      color: pathname === '/profile' && typeof window !== 'undefined' && window.location.search.includes('tab=notifications') ? colors.primary : colors.white,
                      backgroundColor: colors.card,
                      borderRadius: borderRadius.lg,
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: 500,
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span style={{ fontSize: '20px', position: 'relative', display: 'inline-flex' }}>
                      <BellIcon />
                      {unreadCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-6px',
                          minWidth: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.error,
                          color: colors.white,
                          fontSize: '10px',
                          fontWeight: 700,
                          borderRadius: '50%',
                          padding: '0 3px',
                        }}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </span>
                    Bildirimler
                    {unreadCount > 0 && (
                      <Badge variant="danger" size="sm" style={{ marginLeft: 'auto' }}>
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </li>
              )}
            </ul>

            {/* Settings & Logout Buttons */}
            <div style={{ marginTop: 'auto', paddingTop: spacing.xl, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <Link href="/settings" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" style={{ width: '100%' }}>
                  Ayarlar
                </Button>
              </Link>
              <Button
                variant="outline"
                style={{ width: '100%' }}
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                Çıkış Yap
              </Button>
            </div>
          </>
        )}

        {!loading && !user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" style={{ width: '100%' }}>
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" style={{ width: '100%' }}>
                Kayıt Ol
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Spacer for fixed navbar */}
      <div style={{ height: '64px' }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .desktop-nav ul {
            display: none !important;
          }
          .desktop-nav > div:first-of-type {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
