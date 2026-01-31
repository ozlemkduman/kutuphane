'use client';

import { colors, borderRadius, shadows, spacing, transitions, zIndex } from '@/lib/theme';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantColors = {
    danger: colors.error,
    warning: colors.warning,
    info: colors.info,
  };

  const variantIcons = {
    danger: '⚠️',
    warning: '⚡',
    info: 'ℹ️',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: colors.overlay,
          zIndex: zIndex.modalBackdrop,
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: colors.card,
          borderRadius: borderRadius.xl,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.xl,
          padding: spacing['2xl'],
          maxWidth: '400px',
          width: '90%',
          zIndex: zIndex.modal,
          animation: 'modalSlideIn 0.2s ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: `${variantColors[variant]}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing.lg,
          }}
        >
          <span style={{ fontSize: '28px' }}>{variantIcons[variant]}</span>
        </div>

        {/* Title */}
        <h2
          id="confirm-modal-title"
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: colors.white,
            textAlign: 'center',
            margin: 0,
            marginBottom: spacing.md,
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: '14px',
            color: colors.gray,
            textAlign: 'center',
            margin: 0,
            marginBottom: spacing.xl,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: spacing.md }}>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            style={{ flex: 1 }}
          >
            {confirmText}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}

export default ConfirmModal;
