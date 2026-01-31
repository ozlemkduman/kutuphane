'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { colors, borderRadius, typography, transitions } from '@/lib/theme';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' | 'outline' | 'danger' | 'developer' | 'admin' | 'member';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    backgroundColor: colors.card,
    color: colors.gray,
    border: `1px solid ${colors.border}`,
  },
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
  },
  success: {
    backgroundColor: colors.successLight,
    color: colors.successDark,
    border: 'none',
  },
  error: {
    backgroundColor: colors.errorLight,
    color: colors.errorDark,
    border: 'none',
  },
  warning: {
    backgroundColor: colors.warningLight,
    color: colors.warningDark,
    border: 'none',
  },
  info: {
    backgroundColor: colors.infoLight,
    color: colors.infoDark,
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
  },
  danger: {
    backgroundColor: colors.errorLight,
    color: colors.errorDark,
    border: 'none',
  },
  developer: {
    backgroundColor: '#7c3aed20',
    color: '#a78bfa',
    border: '1px solid #7c3aed',
  },
  admin: {
    backgroundColor: colors.warningLight,
    color: colors.warningDark,
    border: 'none',
  },
  member: {
    backgroundColor: colors.card,
    color: colors.gray,
    border: `1px solid ${colors.border}`,
  },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: {
    padding: '2px 8px',
    fontSize: typography.fontSize.xs,
  },
  md: {
    padding: '4px 12px',
    fontSize: typography.fontSize.sm,
  },
  lg: {
    padding: '6px 16px',
    fontSize: typography.fontSize.base,
  },
};

const dotColors: Record<BadgeVariant, string> = {
  default: colors.gray,
  primary: colors.primaryLight,
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.info,
  outline: colors.primary,
  danger: colors.error,
  developer: '#a78bfa',
  admin: colors.warning,
  member: colors.gray,
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      removable = false,
      onRemove,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      borderRadius: borderRadius.full,
      fontWeight: typography.fontWeight.medium,
      whiteSpace: 'nowrap',
      transition: `all ${transitions.fast}`,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    const dotStyle: React.CSSProperties = {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: dotColors[variant],
    };

    const removeButtonStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2px',
      marginLeft: '2px',
      marginRight: '-4px',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '50%',
      opacity: 0.7,
      transition: `opacity ${transitions.fast}`,
      color: 'inherit',
    };

    return (
      <span ref={ref} style={baseStyle} {...props}>
        {dot && <span style={dotStyle} />}
        {children}
        {removable && (
          <button
            type="button"
            style={removeButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            aria-label="Kaldır"
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 3.172a.5.5 0 01.707 0L6 5.293l2.121-2.121a.5.5 0 01.707.707L6.707 6l2.121 2.121a.5.5 0 01-.707.707L6 6.707 3.879 8.828a.5.5 0 01-.707-.707L5.293 6 3.172 3.879a.5.5 0 010-.707z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Role-specific badges
export const RoleBadge = ({ role }: { role: 'DEVELOPER' | 'ADMIN' | 'MEMBER' }) => {
  const roleConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    DEVELOPER: { variant: 'primary', label: 'Geliştirici' },
    ADMIN: { variant: 'warning', label: 'Yönetici' },
    MEMBER: { variant: 'default', label: 'Üye' },
  };

  const config = roleConfig[role] || roleConfig.MEMBER;

  return (
    <Badge variant={config.variant} size="sm" dot>
      {config.label}
    </Badge>
  );
};

// Status badges
export const StatusBadge = ({ status }: { status: 'active' | 'inactive' | 'pending' | 'overdue' }) => {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Aktif' },
    inactive: { variant: 'default', label: 'Pasif' },
    pending: { variant: 'warning', label: 'Beklemede' },
    overdue: { variant: 'error', label: 'Gecikmiş' },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant={config.variant} size="sm" dot>
      {config.label}
    </Badge>
  );
};

export default Badge;
