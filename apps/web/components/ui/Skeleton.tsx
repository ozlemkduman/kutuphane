'use client';

import { HTMLAttributes } from 'react';
import { colors, borderRadius } from '@/lib/theme';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = ({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  style,
  ...props
}: SkeletonProps) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: '50%',
          width: width || '40px',
          height: height || '40px',
        };
      case 'rectangular':
        return {
          borderRadius: 0,
          width: width || '100%',
          height: height || '100px',
        };
      case 'rounded':
        return {
          borderRadius: borderRadius.md,
          width: width || '100%',
          height: height || '100px',
        };
      case 'text':
      default:
        return {
          borderRadius: borderRadius.sm,
          width: width || '100%',
          height: height || '1em',
        };
    }
  };

  const animationStyles: Record<string, string> = {
    pulse: `
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `,
    wave: `
      @keyframes skeleton-wave {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `,
  };

  const getAnimationStyle = (): React.CSSProperties => {
    switch (animation) {
      case 'pulse':
        return {
          animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        };
      case 'wave':
        return {
          background: `linear-gradient(90deg, ${colors.card} 25%, ${colors.cardHover} 50%, ${colors.card} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'skeleton-wave 1.5s ease-in-out infinite',
        };
      default:
        return {};
    }
  };

  const baseStyle: React.CSSProperties = {
    backgroundColor: colors.card,
    display: 'block',
    ...getVariantStyles(),
    ...getAnimationStyle(),
    ...style,
  };

  return (
    <>
      {animation !== 'none' && (
        <style>{animationStyles[animation]}</style>
      )}
      <span
        style={baseStyle}
        aria-hidden="true"
        {...props}
      />
    </>
  );
};

// Skeleton presets for common use cases
export const SkeletonText = ({ lines = 3, ...props }: SkeletonProps & { lines?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={index === lines - 1 ? '60%' : '100%'}
        {...props}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ ...props }: SkeletonProps) => (
  <div
    style={{
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: '24px',
      border: `1px solid ${colors.border}`,
    }}
  >
    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
      <Skeleton variant="circular" width={48} height={48} {...props} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height="20px" style={{ marginBottom: '8px' }} {...props} />
        <Skeleton variant="text" width="40%" height="16px" {...props} />
      </div>
    </div>
    <SkeletonText lines={3} {...props} />
  </div>
);

export const SkeletonAvatar = ({ size = 40, ...props }: SkeletonProps & { size?: number }) => (
  <Skeleton variant="circular" width={size} height={size} {...props} />
);

export const SkeletonButton = ({ width = 100, height = 40, ...props }: SkeletonProps) => (
  <Skeleton variant="rounded" width={width} height={height} {...props} />
);

export default Skeleton;
