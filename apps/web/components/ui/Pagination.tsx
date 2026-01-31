'use client';

import { colors, borderRadius, spacing, transitions } from '@/lib/theme';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const half = Math.floor(showPageNumbers / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + showPageNumbers - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < showPageNumbers) {
      start = Math.max(1, end - showPageNumbers + 1);
    }

    // Add first page and ellipsis
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const buttonStyle = (isActive: boolean, isDisabled: boolean): React.CSSProperties => ({
    padding: `${spacing.sm} ${spacing.md}`,
    minWidth: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isActive ? colors.primary : colors.card,
    color: isActive ? colors.white : isDisabled ? colors.darkGray : colors.gray,
    border: `1px solid ${isActive ? colors.primary : colors.border}`,
    borderRadius: borderRadius.md,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 400,
    transition: `all ${transitions.normal}`,
    opacity: isDisabled ? 0.5 : 1,
  });

  const pages = getPageNumbers();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.xl,
      }}
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={buttonStyle(false, currentPage === 1)}
        aria-label="Önceki sayfa"
      >
        ←
      </button>

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              style={{
                padding: spacing.sm,
                color: colors.gray,
                fontSize: '14px',
              }}
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            style={buttonStyle(pageNum === currentPage, false)}
            aria-current={pageNum === currentPage ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={buttonStyle(false, currentPage === totalPages)}
        aria-label="Sonraki sayfa"
      >
        →
      </button>
    </div>
  );
}

export default Pagination;
