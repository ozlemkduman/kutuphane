'use client';

import { forwardRef, HTMLAttributes, ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { colors, borderRadius, shadows, spacing, transitions, zIndex, typography } from '@/lib/theme';

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeStyles: Record<'sm' | 'md' | 'lg' | 'xl' | 'full', React.CSSProperties> = {
  sm: { maxWidth: '400px' },
  md: { maxWidth: '500px' },
  lg: { maxWidth: '700px' },
  xl: { maxWidth: '900px' },
  full: { maxWidth: '95vw', maxHeight: '95vh' },
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      size = 'md',
      closeOnOverlay = true,
      closeOnEscape = true,
      showCloseButton = true,
      children,
      footer,
      style,
      ...props
    },
    ref
  ) => {
    const handleEscape = useCallback(
      (e: KeyboardEvent) => {
        if (closeOnEscape && e.key === 'Escape') {
          onClose();
        }
      },
      [closeOnEscape, onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const overlayStyle: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      backgroundColor: colors.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      zIndex: zIndex.modalBackdrop,
      animation: 'fadeIn 0.2s ease-out',
    };

    const modalStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.xl,
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      animation: 'scaleIn 0.2s ease-out',
      zIndex: zIndex.modal,
      ...sizeStyles[size],
      ...style,
    };

    const headerStyle: React.CSSProperties = {
      padding: spacing.xl,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    };

    const titleStyle: React.CSSProperties = {
      margin: 0,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      color: colors.white,
    };

    const descriptionStyle: React.CSSProperties = {
      margin: 0,
      marginTop: spacing.sm,
      fontSize: typography.fontSize.sm,
      color: colors.gray,
    };

    const closeButtonStyle: React.CSSProperties = {
      padding: spacing.sm,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: colors.gray,
      borderRadius: borderRadius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: `all ${transitions.fast}`,
      flexShrink: 0,
    };

    const contentStyle: React.CSSProperties = {
      padding: spacing.xl,
      overflowY: 'auto',
      flex: 1,
    };

    const footerStyle: React.CSSProperties = {
      padding: spacing.xl,
      borderTop: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.md,
    };

    const modalContent = (
      <>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div
          style={overlayStyle}
          onClick={closeOnOverlay ? onClose : undefined}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          <div
            ref={ref}
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {(title || showCloseButton) && (
              <div style={headerStyle}>
                <div>
                  {title && (
                    <h2 id="modal-title" style={titleStyle}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-description" style={descriptionStyle}>
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    style={closeButtonStyle}
                    onClick={onClose}
                    aria-label="Kapat"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bg;
                      e.currentTarget.style.color = colors.white;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = colors.gray;
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <div style={contentStyle}>{children}</div>
            {footer && <div style={footerStyle}>{footer}</div>}
          </div>
        </div>
      </>
    );

    if (typeof window === 'undefined') return null;
    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

export default Modal;
