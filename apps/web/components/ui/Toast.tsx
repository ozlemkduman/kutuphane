'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { colors, borderRadius, shadows, spacing, transitions, zIndex } from '@/lib/theme';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Toast icons
const ToastIcon = ({ type }: { type: ToastType }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
  return <span style={{ fontSize: '18px' }}>{icons[type]}</span>;
};

// Toast colors
const toastColors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: `${colors.success}15`,
    border: colors.success,
    icon: colors.success,
  },
  error: {
    bg: `${colors.error}15`,
    border: colors.error,
    icon: colors.error,
  },
  warning: {
    bg: `${colors.warning}15`,
    border: colors.warning,
    icon: colors.warning,
  },
  info: {
    bg: `${colors.info}15`,
    border: colors.info,
    icon: colors.info,
  },
};

// Single Toast Component
const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) => {
  const colorScheme = toastColors[toast.type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.md} ${spacing.lg}`,
        backgroundColor: colorScheme.bg,
        border: `1px solid ${colorScheme.border}`,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.lg,
        minWidth: '300px',
        maxWidth: '450px',
        animation: 'toastSlideIn 0.3s ease-out',
      }}
      role="alert"
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: colorScheme.icon,
          color: colors.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <ToastIcon type={toast.type} />
      </div>
      <p
        style={{
          flex: 1,
          color: colors.white,
          fontSize: '14px',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          padding: spacing.xs,
          backgroundColor: 'transparent',
          border: 'none',
          color: colors.gray,
          cursor: 'pointer',
          borderRadius: borderRadius.sm,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: `color ${transitions.fast}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = colors.white;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = colors.gray;
        }}
        aria-label="Kapat"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.225 4.811a1 1 0 00-1.414 1.414L10.586 12 4.81 17.775a1 1 0 101.414 1.414L12 13.414l5.775 5.775a1 1 0 001.414-1.414L13.414 12l5.775-5.775a1 1 0 00-1.414-1.414L12 10.586 6.225 4.81z" />
        </svg>
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) => {
  if (toasts.length === 0) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: spacing.xl,
          right: spacing.xl,
          zIndex: zIndex.toast,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast('success', message, duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => showToast('error', message, duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => showToast('warning', message, duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => showToast('info', message, duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, warning, info, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
