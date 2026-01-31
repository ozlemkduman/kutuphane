'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';
import { colors, borderRadius, transitions, typography } from '@/lib/theme';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string; // Alias for hint
  icon?: ReactNode; // Alias for leftIcon
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: {
    paddingVertical: '8px',
    paddingHorizontal: '12px',
    fontSize: '14px',
  },
  md: {
    paddingVertical: '12px',
    paddingHorizontal: '16px',
    fontSize: '16px',
  },
  lg: {
    paddingVertical: '16px',
    paddingHorizontal: '20px',
    fontSize: '18px',
  },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      helperText,
      icon,
      leftIcon,
      rightIcon,
      size = 'md',
      fullWidth = true,
      disabled,
      id,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const actualHint = hint || helperText;
    const actualLeftIcon = leftIcon || icon;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = actualHint && !error ? `${inputId}-hint` : undefined;

    const containerStyle: React.CSSProperties = {
      width: fullWidth ? '100%' : 'auto',
      marginBottom: '16px',
    };

    const labelStyle: React.CSSProperties = {
      display: 'block',
      marginBottom: '8px',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: error ? colors.error : colors.grayLight,
    };

    const inputWrapperStyle: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    };

    const inputStyle: React.CSSProperties = {
      width: '100%',
      backgroundColor: colors.bg,
      color: colors.white,
      border: `1px solid ${error ? colors.error : isFocused ? colors.primary : colors.border}`,
      borderRadius: borderRadius.md,
      outline: 'none',
      transition: `all ${transitions.normal}`,
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : 'text',
      paddingLeft: actualLeftIcon ? '44px' : sizeStyles[size].paddingHorizontal,
      paddingRight: rightIcon ? '44px' : sizeStyles[size].paddingHorizontal,
      paddingTop: sizeStyles[size].paddingVertical,
      paddingBottom: sizeStyles[size].paddingVertical,
      fontSize: sizeStyles[size].fontSize,
      boxSizing: 'border-box',
      ...style,
    };

    const iconStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      color: error ? colors.error : isFocused ? colors.primary : colors.gray,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    };

    const leftIconStyle: React.CSSProperties = {
      ...iconStyle,
      left: '14px',
    };

    const rightIconStyle: React.CSSProperties = {
      ...iconStyle,
      right: '14px',
    };

    const messageStyle: React.CSSProperties = {
      marginTop: '6px',
      fontSize: typography.fontSize.sm,
      color: error ? colors.error : colors.gray,
    };

    return (
      <div style={containerStyle}>
        {label && (
          <label htmlFor={inputId} style={labelStyle}>
            {label}
          </label>
        )}
        <div style={inputWrapperStyle}>
          {actualLeftIcon && <span style={leftIconStyle}>{actualLeftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            style={inputStyle}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={errorId || hintId}
            {...props}
          />
          {rightIcon && <span style={rightIconStyle}>{rightIcon}</span>}
        </div>
        {error && (
          <p id={errorId} role="alert" style={messageStyle}>
            {error}
          </p>
        )}
        {actualHint && !error && (
          <p id={hintId} style={messageStyle}>
            {actualHint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
