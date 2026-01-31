'use client';

import { forwardRef, HTMLAttributes, ReactNode, useState } from 'react';
import { colors, borderRadius, spacing, transitions, typography } from '@/lib/theme';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; color: string; iconColor: string }> = {
  success: {
    bg: colors.successLight,
    border: colors.success,
    color: colors.successDark,
    iconColor: colors.success,
  },
  error: {
    bg: colors.errorLight,
    border: colors.error,
    color: colors.errorDark,
    iconColor: colors.error,
  },
  warning: {
    bg: colors.warningLight,
    border: colors.warning,
    color: colors.warningDark,
    iconColor: colors.warning,
  },
  info: {
    bg: colors.infoLight,
    border: colors.info,
    color: colors.infoDark,
    iconColor: colors.info,
  },
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      dismissible = false,
      onDismiss,
      icon,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);
    const styles = variantStyles[variant];

    if (!isVisible) return null;

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.lg,
      backgroundColor: styles.bg,
      border: `1px solid ${styles.border}`,
      borderRadius: borderRadius.md,
      color: styles.color,
      transition: `all ${transitions.normal}`,
      ...style,
    };

    const iconContainerStyle: React.CSSProperties = {
      flexShrink: 0,
      color: styles.iconColor,
      display: 'flex',
      alignItems: 'center',
    };

    const contentStyle: React.CSSProperties = {
      flex: 1,
      minWidth: 0,
    };

    const titleStyle: React.CSSProperties = {
      margin: 0,
      marginBottom: title && children ? spacing.sm : 0,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: styles.color,
    };

    const messageStyle: React.CSSProperties = {
      margin: 0,
      fontSize: typography.fontSize.sm,
      color: styles.color,
      opacity: 0.9,
    };

    const dismissButtonStyle: React.CSSProperties = {
      flexShrink: 0,
      padding: spacing.xs,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: styles.color,
      opacity: 0.7,
      borderRadius: borderRadius.sm,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: `opacity ${transitions.fast}`,
    };

    return (
      <div
        ref={ref}
        role="alert"
        style={containerStyle}
        {...props}
      >
        <span style={iconContainerStyle}>
          {icon || defaultIcons[variant]}
        </span>
        <div style={contentStyle}>
          {title && <h4 style={titleStyle}>{title}</h4>}
          <div style={messageStyle}>{children}</div>
        </div>
        {dismissible && (
          <button
            type="button"
            style={dismissButtonStyle}
            onClick={handleDismiss}
            aria-label="Kapat"
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
