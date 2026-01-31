// Favoriler Sayfası
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';

interface Favorite {
  id: string;
  createdAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    coverImage: string | null;
    available: number;
    quantity: number;
    category: {
      id: string;
      name: string;
    } | null;
  };
}

const getCoverUrl = (isbn: string, coverImage: string | null) => {
  if (coverImage) return coverImage;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const { user, profile, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role === 'DEVELOPER') {
        router.push('/developer');
      }
    }
  }, [authLoading, user, profile, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchFavorites();
  }, [authLoading, user]);

  const fetchFavorites = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setFavorites(await res.json());
      }
    } catch {
      toast.error('Favoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (bookId: string) => {
    setRemoving(bookId);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites/toggle/${bookId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setFavorites(favorites.filter((f) => f.book.id !== bookId));
        toast.success('Favorilerden kaldırıldı');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setRemoving(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main id="main-content" role="main" aria-label="Favorilerim" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
          <Skeleton variant="text" width="200px" height="32px" style={{ marginBottom: spacing.xl }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: spacing.lg }}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} style={{ padding: spacing.lg }}>
                <div style={{ display: 'flex', gap: spacing.md }}>
                  <Skeleton variant="rounded" width="80px" height="120px" />
                  <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="100%" height="20px" style={{ marginBottom: spacing.sm }} />
                    <Skeleton variant="text" width="70%" height="16px" style={{ marginBottom: spacing.md }} />
                    <Skeleton variant="text" width="50%" height="14px" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main id="main-content" role="main" aria-label="Favorilerim" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.white, margin: 0 }}>
            Favorilerim
            <span style={{ color: colors.gray, fontSize: '16px', fontWeight: 400, marginLeft: spacing.md }}>
              ({favorites.length} kitap)
            </span>
          </h1>
        </div>

        {favorites.length === 0 ? (
          <Card style={{ padding: spacing['3xl'], textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: spacing.lg }}>💔</div>
            <h2 style={{ color: colors.white, fontSize: '20px', marginBottom: spacing.md }}>
              Henüz favoriniz yok
            </h2>
            <p style={{ color: colors.gray, marginBottom: spacing.xl }}>
              Kitaplara giderek beğendiğiniz kitapları favorilere ekleyebilirsiniz.
            </p>
            <Link href="/books">
              <Button>Kitaplara Git</Button>
            </Link>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: spacing.lg }}>
            {favorites.map((favorite) => (
              <Card
                key={favorite.id}
                style={{
                  padding: spacing.lg,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/books/${favorite.book.id}`)}
              >
                <div style={{ display: 'flex', gap: spacing.md }}>
                  {/* Kapak resmi */}
                  <div style={{
                    width: '80px',
                    height: '120px',
                    backgroundColor: colors.bgLight,
                    borderRadius: borderRadius.md,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <img
                      src={getCoverUrl(favorite.book.isbn, favorite.book.coverImage)}
                      alt={favorite.book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/80x120/3d3830/d97706?text=${encodeURIComponent(favorite.book.title.substring(0, 8))}`;
                      }}
                    />
                  </div>

                  {/* Kitap bilgileri */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      color: colors.white,
                      fontSize: '16px',
                      fontWeight: 600,
                      marginBottom: spacing.xs,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {favorite.book.title}
                    </h3>
                    <p style={{
                      color: colors.primaryLight,
                      fontSize: '14px',
                      marginBottom: spacing.sm,
                    }}>
                      {favorite.book.author}
                    </p>

                    {favorite.book.category && (
                      <Badge variant="info" style={{ marginBottom: spacing.sm }}>
                        {favorite.book.category.name}
                      </Badge>
                    )}

                    <div style={{ marginTop: spacing.sm }}>
                      <Badge variant={favorite.book.available > 0 ? 'success' : 'warning'}>
                        {favorite.book.available > 0 ? `${favorite.book.available} mevcut` : 'Stokta yok'}
                      </Badge>
                    </div>

                    <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.sm }}>
                      Eklenme: {new Date(favorite.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>

                  {/* Kaldır butonu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(favorite.book.id);
                    }}
                    disabled={removing === favorite.book.id}
                    title="Favorilerden kaldır"
                    aria-label="Favorilerden kaldır"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: removing === favorite.book.id ? 'default' : 'pointer',
                      fontSize: '24px',
                      color: '#ef4444',
                      opacity: removing === favorite.book.id ? 0.5 : 1,
                      transition: 'all 0.2s',
                      alignSelf: 'flex-start',
                      padding: spacing.xs,
                    }}
                    onMouseEnter={(e) => {
                      if (removing !== favorite.book.id) {
                        e.currentTarget.style.transform = 'scale(1.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ❤️
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
