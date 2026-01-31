'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero, Features, HowItWorks, PopularBooks, CTASection, AnimatedBook } from '@/components/landing';
import { colors } from '@/lib/theme';

export default function LandingPage() {
  const { user, profile, loading } = useAuth();
  const isAuthenticated = !loading && !!user && !!profile;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Animated Book - Shows on first visit, then not for 1 hour */}
      <AnimatedBook />

      <Navbar transparent />

      <main>
        <Hero isAuthenticated={isAuthenticated} />
        <Features />
        <HowItWorks />
        <PopularBooks />
        <CTASection isAuthenticated={isAuthenticated} />
      </main>

      <Footer />
    </div>
  );
}
