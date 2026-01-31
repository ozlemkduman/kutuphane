'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { colors, borderRadius, shadows, spacing, transitions } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  category?: {
    name: string;
    icon: string;
  };
}

export const PopularBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/public`);
        if (response.ok) {
          const data = await response.json();
          setBooks(data.slice(0, 6));
        }
      } catch {
        // Silently fail - books will show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <section
      style={{
        padding: `${spacing['4xl']} ${spacing.xl}`,
        backgroundColor: colors.bgLight,
      }}
      aria-labelledby="popular-books-title"
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spacing.lg,
            marginBottom: spacing['2xl'],
          }}
        >
          <div>
            <h2
              id="popular-books-title"
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 700,
                color: colors.white,
                marginBottom: spacing.sm,
              }}
            >
              Popüler Kitaplar
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: colors.gray,
                margin: 0,
              }}
            >
              En çok ödünç alınan kitapları keşfedin.
            </p>
          </div>

          <Link href="/books">
            <Button variant="outline" size="md">
              Tümünü Gör
            </Button>
          </Link>
        </div>

        {/* Books Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: spacing.xl,
          }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton variant="rounded" height={240} style={{ marginBottom: spacing.md }} />
                  <Skeleton variant="text" width="80%" style={{ marginBottom: spacing.xs }} />
                  <Skeleton variant="text" width="60%" />
                </div>
              ))
            : books.map((book, index) => (
                <article
                  key={book.id}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: borderRadius.lg,
                    overflow: 'hidden',
                    border: `1px solid ${colors.border}`,
                    transition: `all ${transitions.normal}`,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = shadows.lg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Book Cover */}
                  <div
                    style={{
                      height: '200px',
                      backgroundColor: colors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100px',
                          height: '140px',
                          background: `linear-gradient(135deg, ${colors.primary}40, ${colors.primaryLight}40)`,
                          borderRadius: borderRadius.md,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '40px',
                        }}
                      >
                        📚
                      </div>
                    )}

                    {/* Ranking Badge */}
                    {index < 3 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: spacing.sm,
                          left: spacing.sm,
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background:
                            index === 0
                              ? 'linear-gradient(135deg, #ffd700, #ffb347)'
                              : index === 1
                              ? 'linear-gradient(135deg, #c0c0c0, #a8a8a8)'
                              : 'linear-gradient(135deg, #cd7f32, #b87333)',
                          color: colors.white,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 700,
                          boxShadow: shadows.sm,
                        }}
                      >
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div style={{ padding: spacing.lg }}>
                    {/* Category */}
                    {book.category && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: colors.primary,
                          marginBottom: spacing.xs,
                        }}
                      >
                        {book.category.icon} {book.category.name}
                      </span>
                    )}

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: colors.white,
                        marginBottom: spacing.xs,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {book.title}
                    </h3>

                    {/* Author */}
                    <p
                      style={{
                        fontSize: '13px',
                        color: colors.gray,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {book.author}
                    </p>
                  </div>
                </article>
              ))}
        </div>

        {/* Empty State */}
        {!loading && books.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: spacing['3xl'],
              color: colors.gray,
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: spacing.sm }}>
              Henüz kitap eklenmemiş.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularBooks;
