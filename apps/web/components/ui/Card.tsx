'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { colors, borderRadius, shadows, transitions, spacing } from '@/lib/theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  children: ReactNode;
}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  default: {
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
  },
  elevated: {
    backgroundColor: colors.card,
    border: 'none',
    boxShadow: shadows.md,
  },
  outlined: {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    border: 'none',
  },
};

const paddingStyles: Record<CardPadding, React.CSSProperties> = {
  none: { padding: 0 },
  sm: { padding: spacing.md },
  md: { padding: spacing.xl },
  lg: { padding: spacing['2xl'] },
};

const CardBase = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      clickable = false,
      children,
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const baseStyle: React.CSSProperties = {
      borderRadius: borderRadius.lg,
      transition: `all ${transitions.normal}`,
      cursor: clickable ? 'pointer' : 'default',
      ...variantStyles[variant],
      ...paddingStyles[padding],
      ...style,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable || clickable) {
        e.currentTarget.style.backgroundColor = colors.cardHover;
        if (variant === 'elevated') {
          e.currentTarget.style.boxShadow = shadows.lg;
        }
        e.currentTarget.style.transform = 'translateY(-2px)';
      }
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable || clickable) {
        e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor || '';
        if (variant === 'elevated') {
          e.currentTarget.style.boxShadow = shadows.md;
        }
        e.currentTarget.style.transform = 'translateY(0)';
      }
      onMouseLeave?.(e);
    };

    return (
      <div
        ref={ref}
        style={baseStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBase.displayName = 'Card';

// Card sub-components
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        marginBottom: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottom: `1px solid ${colors.border}`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, as: Component = 'h3', style, ...props }, ref) => (
    <Component
      ref={ref}
      style={{
        margin: 0,
        fontSize: '20px',
        fontWeight: 600,
        color: colors.white,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        color: colors.gray,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

// Compound component pattern - attach sub-components to Card
type CardComponent = typeof CardBase & {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
};

const Card = CardBase as CardComponent;
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export { Card };
export default Card;
