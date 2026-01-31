'use client';

import { useState, useEffect } from 'react';
import { colors, shadows } from '@/lib/theme';

const STORAGE_KEY = 'lastBookAnimationShown';
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export const AnimatedBook = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check localStorage for last shown time
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (lastShown) {
      const timeSinceLastShown = now - parseInt(lastShown, 10);
      if (timeSinceLastShown < COOLDOWN_MS) {
        // Still in cooldown period, don't show
        return;
      }
    }

    // Show the animation
    setIsVisible(true);
    // Store the current timestamp
    localStorage.setItem(STORAGE_KEY, now.toString());
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Animated book welcome"
    >
      <div
        style={{
          position: 'relative',
          perspective: '1500px',
          transform: isClosing ? 'scale(0.8)' : 'scale(1)',
          opacity: isClosing ? 0 : 1,
          transition: 'all 0.5s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Book Container */}
        <div
          style={{
            width: '280px',
            height: '380px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            animation: 'bookFloat 3s ease-in-out infinite',
          }}
        >
          {/* Book Cover - Front */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: `linear-gradient(145deg, ${colors.primary}, ${colors.primaryLight})`,
              borderRadius: '4px 16px 16px 4px',
              boxShadow: shadows.glowStrong,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
              animation: 'bookOpen 2s ease-in-out infinite alternate',
              transformOrigin: 'left center',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                marginBottom: '16px',
              }}
            >
              📚
            </div>
            <h2
              style={{
                color: colors.white,
                fontSize: '24px',
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: '8px',
              }}
            >
              Kitaphane
            </h2>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              Dijital Kütüphane
            </p>
          </div>

          {/* Book Spine */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: '30px',
              height: '100%',
              background: `linear-gradient(90deg, ${colors.primary}dd, ${colors.primary})`,
              borderRadius: '4px 0 0 4px',
              transform: 'translateX(-29px) rotateY(-90deg)',
              transformOrigin: 'right center',
            }}
          />

          {/* Book Pages */}
          <div
            style={{
              position: 'absolute',
              right: '4px',
              top: '4px',
              width: '20px',
              height: 'calc(100% - 8px)',
              background: `repeating-linear-gradient(
                to bottom,
                #f5f5f4 0px,
                #f5f5f4 2px,
                #e7e5e4 2px,
                #e7e5e4 4px
              )`,
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>

        {/* Welcome Message */}
        <div
          style={{
            marginTop: '32px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              color: colors.white,
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            Hoş Geldiniz!
          </h1>
          <p
            style={{
              color: colors.gray,
              fontSize: '16px',
              marginBottom: '24px',
            }}
          >
            Dijital kütüphane deneyimine hazır mısınız?
          </p>
          <button
            onClick={handleClose}
            style={{
              padding: '14px 40px',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              color: colors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: shadows.glow,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = shadows.glowStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = shadows.glow;
            }}
          >
            Keşfetmeye Başla
          </button>
        </div>

        {/* Skip hint */}
        <p
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: colors.gray,
            fontSize: '12px',
            opacity: 0.7,
          }}
        >
          Herhangi bir yere tıklayarak atlayabilirsiniz
        </p>
      </div>

      <style>{`
        @keyframes bookFloat {
          0%, 100% { transform: translateY(0) rotateY(-5deg); }
          50% { transform: translateY(-15px) rotateY(5deg); }
        }
        @keyframes bookOpen {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-25deg); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBook;
