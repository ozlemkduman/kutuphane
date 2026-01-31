'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { colors, borderRadius, transitions } from '@/lib/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
  },
  secondary: {
    backgroundColor: colors.card,
    color: colors.white,
    border: `1px solid ${colors.border}`,
  },
  outline: {
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.gray,
    border: 'none',
  },
  danger: {
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
  },
};

const variantHoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.primaryHover,
  },
  secondary: {
    backgroundColor: colors.cardHover,
    borderColor: colors.borderLight,
  },
  outline: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  ghost: {
    backgroundColor: colors.card,
    color: colors.white,
  },
  danger: {
    backgroundColor: colors.errorDark,
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: '8px 16px',
    fontSize: '14px',
    borderRadius: borderRadius.md,
  },
  md: {
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: borderRadius.md,
  },
  lg: {
    padding: '16px 32px',
    fontSize: '18px',
    borderRadius: borderRadius.lg,
  },
};

const LoadingSpinner = () => (
  <svg
    style={{
      width: '20px',
      height: '20px',
      animation: 'spin 1s linear infinite',
    }}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="31.4 31.4"
      style={{ opacity: 0.3 }}
    />
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="31.4 31.4"
      strokeDashoffset="75"
    />
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: 600,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.6 : 1,
      transition: `all ${transitions.normal}`,
      outline: 'none',
      width: fullWidth ? '100%' : 'auto',
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        Object.assign(e.currentTarget.style, variantHoverStyles[variant]);
      }
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        Object.assign(e.currentTarget.style, variantStyles[variant]);
      }
      onMouseLeave?.(e);
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={baseStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
            {children}
            {rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
