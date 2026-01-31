'use client';

import Link from 'next/link';
import { colors, spacing, borderRadius, transitions } from '@/lib/theme';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Hızlı Erişim',
    links: [
      { label: 'Kitaplar', href: '/books' },
      { label: 'Kategoriler', href: '/books?tab=categories' },
      { label: 'Profilim', href: '/profile' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { label: 'SSS', href: '/faq' },
      { label: 'İletişim', href: '/contact' },
      { label: 'Yardım', href: '/help' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { label: 'Gizlilik Politikası', href: '/privacy' },
      { label: 'Kullanım Koşulları', href: '/terms' },
      { label: 'KVKK', href: '/kvkk' },
    ],
  },
];

export interface FooterProps {
  minimal?: boolean;
}

export const Footer = ({ minimal = false }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  const footerStyle: React.CSSProperties = {
    backgroundColor: colors.card,
    borderTop: `1px solid ${colors.border}`,
    marginTop: 'auto',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: minimal ? `${spacing.lg} ${spacing.xl}` : `${spacing['3xl']} ${spacing.xl} ${spacing.xl}`,
  };

  const topSectionStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing['2xl'],
    marginBottom: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    borderBottom: `1px solid ${colors.border}`,
  };

  const brandStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    color: colors.white,
    fontSize: '20px',
    fontWeight: 700,
    textDecoration: 'none',
  };

  const brandDescriptionStyle: React.CSSProperties = {
    color: colors.gray,
    fontSize: '14px',
    lineHeight: 1.6,
    maxWidth: '280px',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: colors.white,
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: spacing.sm,
  };

  const linkListStyle: React.CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  };

  const linkStyle: React.CSSProperties = {
    color: colors.gray,
    textDecoration: 'none',
    fontSize: '14px',
    transition: `color ${transitions.fast}`,
    display: 'inline-block',
  };

  const bottomSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  };

  const copyrightStyle: React.CSSProperties = {
    color: colors.darkGray,
    fontSize: '13px',
  };

  const socialLinksStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.md,
  };

  const socialLinkStyle: React.CSSProperties = {
    color: colors.gray,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg,
    transition: `all ${transitions.fast}`,
    textDecoration: 'none',
  };

  if (minimal) {
    return (
      <footer style={footerStyle}>
        <div style={containerStyle}>
          <div style={bottomSectionStyle}>
            <span style={copyrightStyle}>
              &copy; {currentYear} Kütüphane. Tüm hakları saklıdır.
            </span>
            <div style={{ display: 'flex', gap: spacing.lg }}>
              <Link href="/privacy" style={{ ...linkStyle, fontSize: '13px' }}>
                Gizlilik
              </Link>
              <Link href="/terms" style={{ ...linkStyle, fontSize: '13px' }}>
                Koşullar
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        <div style={topSectionStyle}>
          {/* Brand Section */}
          <div style={brandStyle}>
            <Link href="/" style={logoStyle}>
              <span style={{ fontSize: '24px' }}>📚</span>
              <span>Kütüphane</span>
            </Link>
            <p style={brandDescriptionStyle}>
              Okulunuzun dijital kütüphanesi. Kitapları keşfedin, ödünç alın ve
              okuma deneyiminizi zenginleştirin.
            </p>
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title} style={sectionStyle}>
              <h3 style={sectionTitleStyle}>{section.title}</h3>
              <ul style={linkListStyle}>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={linkStyle}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.white;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.gray;
                      }}
                    >
                      {link.label}
                      {link.external && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                          style={{ marginLeft: '4px', verticalAlign: 'middle' }}
                        >
                          <path d="M3.5 3a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v5a.5.5 0 01-1 0V4.207L3.854 8.854a.5.5 0 11-.708-.708L7.793 3.5H4a.5.5 0 01-.5-.5z" />
                        </svg>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div style={bottomSectionStyle}>
          <span style={copyrightStyle}>
            &copy; {currentYear} Kütüphane. Tüm hakları saklıdır.
          </span>

          <div style={socialLinksStyle}>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              style={socialLinkStyle}
              aria-label="Twitter"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg;
                e.currentTarget.style.color = colors.gray;
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={socialLinkStyle}
              aria-label="Instagram"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg;
                e.currentTarget.style.color = colors.gray;
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="mailto:info@kutuphane.com"
              style={socialLinkStyle}
              aria-label="E-posta"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg;
                e.currentTarget.style.color = colors.gray;
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
