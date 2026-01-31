'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { colors, spacing, breakpoints } from '@/lib/theme';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  padding?: boolean;
  centered?: boolean;
  children: ReactNode;
}

const maxWidths: Record<ContainerSize, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
};

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  (
    {
      size = 'xl',
      padding = true,
      centered = true,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const containerStyle: React.CSSProperties = {
      width: '100%',
      maxWidth: maxWidths[size],
      margin: centered ? '0 auto' : undefined,
      padding: padding ? `${spacing.xl} ${spacing.lg}` : undefined,
      minHeight: 'calc(100vh - 60px)', // Account for navbar
      ...style,
    };

    return (
      <main ref={ref} style={containerStyle} {...props}>
        {children}
      </main>
    );
  }
);

PageContainer.displayName = 'PageContainer';

// Page header component
export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, breadcrumb, style, ...props }, ref) => {
    const headerStyle: React.CSSProperties = {
      marginBottom: spacing['2xl'],
      ...style,
    };

    const titleRowStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.lg,
    };

    const titleStyle: React.CSSProperties = {
      margin: 0,
      fontSize: '28px',
      fontWeight: 700,
      color: colors.white,
    };

    const descriptionStyle: React.CSSProperties = {
      margin: 0,
      marginTop: spacing.sm,
      fontSize: '16px',
      color: colors.gray,
    };

    const breadcrumbStyle: React.CSSProperties = {
      marginBottom: spacing.md,
    };

    return (
      <header ref={ref} style={headerStyle} {...props}>
        {breadcrumb && <div style={breadcrumbStyle}>{breadcrumb}</div>}
        <div style={titleRowStyle}>
          <div>
            <h1 style={titleStyle}>{title}</h1>
            {description && <p style={descriptionStyle}>{description}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </header>
    );
  }
);

PageHeader.displayName = 'PageHeader';

// Section component
export interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  children: ReactNode;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ title, description, children, style, ...props }, ref) => {
    const sectionStyle: React.CSSProperties = {
      marginBottom: spacing['3xl'],
      ...style,
    };

    const titleStyle: React.CSSProperties = {
      margin: 0,
      marginBottom: spacing.sm,
      fontSize: '20px',
      fontWeight: 600,
      color: colors.white,
    };

    const descriptionStyle: React.CSSProperties = {
      margin: 0,
      marginBottom: spacing.lg,
      fontSize: '14px',
      color: colors.gray,
    };

    return (
      <section ref={ref} style={sectionStyle} {...props}>
        {title && <h2 style={titleStyle}>{title}</h2>}
        {description && <p style={descriptionStyle}>{description}</p>}
        {children}
      </section>
    );
  }
);

Section.displayName = 'Section';

// Grid layout component
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: string;
  children: ReactNode;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ cols = 1, gap = spacing.lg, children, style, ...props }, ref) => {
    const getGridCols = (): string => {
      if (typeof cols === 'number') {
        return `repeat(${cols}, 1fr)`;
      }
      return `repeat(${cols.sm || 1}, 1fr)`;
    };

    const gridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: getGridCols(),
      gap,
      ...style,
    };

    // Generate responsive CSS if cols is object
    const responsiveCSS = typeof cols === 'object' ? `
      @media (min-width: ${breakpoints.sm}) {
        .responsive-grid { grid-template-columns: repeat(${cols.sm || 1}, 1fr) !important; }
      }
      @media (min-width: ${breakpoints.md}) {
        .responsive-grid { grid-template-columns: repeat(${cols.md || cols.sm || 1}, 1fr) !important; }
      }
      @media (min-width: ${breakpoints.lg}) {
        .responsive-grid { grid-template-columns: repeat(${cols.lg || cols.md || cols.sm || 1}, 1fr) !important; }
      }
      @media (min-width: ${breakpoints.xl}) {
        .responsive-grid { grid-template-columns: repeat(${cols.xl || cols.lg || cols.md || cols.sm || 1}, 1fr) !important; }
      }
    ` : '';

    return (
      <>
        {responsiveCSS && <style>{responsiveCSS}</style>}
        <div
          ref={ref}
          style={gridStyle}
          className={typeof cols === 'object' ? 'responsive-grid' : undefined}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

Grid.displayName = 'Grid';

export default PageContainer;
