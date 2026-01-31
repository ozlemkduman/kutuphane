// Kitap Detay Sayfası
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, shadows, spacing } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string | null;
  coverImage: string | null;
  available: number;
  quantity: number;
  createdAt: string;
}

// ISBN'den kapak resmi URL'i oluştur (Open Library API)
const getCoverUrl = (isbn: string, coverImage: string | null) => {
  if (coverImage) return coverImage;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
};

export default function BookDetailPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [hasReservation, setHasReservation] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string | null; createdAt: string; user: { id: string; name: string } }[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Favorites state
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const { user, profile, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;
  const toast = useToast();

  // Auth yüklenene kadar bekle, giriş yapılmamışsa login'e yönlendir
  // Developer'ları developer paneline yönlendir
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
    fetchBook();
    fetchWaitingCount();
    checkUserReservation();
    fetchReviews();
    fetchMyReview();
    checkFavorite();
  }, [bookId, authLoading, user]);

  const fetchBook = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/${bookId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setBook(await res.json());
      } else {
        router.push('/books');
      }
    } catch {
      router.push('/books');
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitingCount = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/book/${bookId}/waiting`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWaitingCount(data.count);
      }
    } catch {
      // ignore
    }
  };

  const checkUserReservation = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const reservations = await res.json();
        const hasActive = reservations.some(
          (r: any) => r.bookId === bookId && (r.status === 'WAITING' || r.status === 'READY')
        );
        setHasReservation(hasActive);
      }
    } catch {
      // ignore
    }
  };

  const fetchReviews = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/book/${bookId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
      }
    } catch {
      // ignore
    }
  };

  const fetchMyReview = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/book/${bookId}/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const review = await res.json();
        if (review) {
          setMyRating(review.rating);
          setMyComment(review.comment || '');
          setHasReviewed(true);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSubmitReview = async () => {
    if (myRating === 0) {
      toast.error('Lütfen bir puan seçin');
      return;
    }

    setSubmittingReview(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/book/${bookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: myRating, comment: myComment || null }),
      });

      if (res.ok) {
        toast.success(hasReviewed ? 'Yorumunuz güncellendi' : 'Yorumunuz eklendi');
        setHasReviewed(true);
        fetchReviews();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Bir hata oluştu');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBorrow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setBorrowing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/${bookId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setBook(book ? { ...book, available: book.available - 1 } : null);
        toast.success('Kitap başarıyla ödünç alındı!');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Bir hata oluştu');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setBorrowing(false);
    }
  };

  const handleReserve = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setReserving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${bookId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success('Kitap rezerve edildi! Müsait olduğunda bildirim alacaksınız.');
        setHasReservation(true);
        setWaitingCount(waitingCount + 1);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Rezervasyon yapılamadı');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setReserving(false);
    }
  };

  const handleCancelReservation = async () => {
    try {
      const token = await getToken();
      // Önce kullanıcının bu kitap için rezervasyonunu bul
      const reservationsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (reservationsRes.ok) {
        const reservations = await reservationsRes.json();
        const activeReservation = reservations.find(
          (r: any) => r.bookId === bookId && (r.status === 'WAITING' || r.status === 'READY')
        );

        if (activeReservation) {
          const cancelRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${activeReservation.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (cancelRes.ok) {
            toast.success('Rezervasyon iptal edildi');
            setHasReservation(false);
            setWaitingCount(Math.max(0, waitingCount - 1));
          }
        }
      }
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  const checkFavorite = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites/check/${bookId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      }
    } catch {
      // ignore
    }
  };

  const toggleFavorite = async () => {
    setTogglingFavorite(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites/toggle/${bookId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
        toast.success(data.isFavorite ? 'Favorilere eklendi' : 'Favorilerden kaldırıldı');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setTogglingFavorite(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main id="main-content" role="main" aria-label="Kitap Detayı" style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
          <Skeleton variant="text" width="140px" height="16px" style={{ marginBottom: spacing.xl }} />

          <Card style={{ padding: spacing['2xl'] }}>
            <div style={{ display: 'flex', gap: spacing['2xl'], flexWrap: 'wrap' }}>
              {/* Kapak Resmi Skeleton */}
              <Skeleton variant="rounded" width="220px" height="320px" />

              {/* Kitap Bilgileri Skeleton */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <Skeleton variant="text" width="80%" height="36px" style={{ marginBottom: spacing.md }} />
                <Skeleton variant="text" width="50%" height="24px" style={{ marginBottom: spacing.xl }} />

                <div style={{ marginBottom: spacing['2xl'] }}>
                  <Skeleton variant="text" width="80px" height="14px" style={{ marginBottom: spacing.sm }} />
                  <Skeleton variant="text" width="100%" height="16px" style={{ marginBottom: spacing.xs }} />
                  <Skeleton variant="text" width="90%" height="16px" style={{ marginBottom: spacing.xs }} />
                  <Skeleton variant="text" width="70%" height="16px" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.xl, marginBottom: spacing['2xl'] }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <Skeleton variant="text" width="60px" height="12px" style={{ marginBottom: spacing.sm }} />
                      <Skeleton variant="text" width="80px" height="18px" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.xl, display: 'flex', gap: spacing.lg }}>
              <Skeleton variant="rounded" width="160px" height="48px" />
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa gösterme (login'e yönlendiriliyor)
  if (!user) {
    return null;
  }

  if (!book) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main id="main-content" role="main" aria-label="Kitap Detayı" style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
        <Link
          href="/books"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.sm,
            color: colors.gray,
            textDecoration: 'none',
            marginBottom: spacing.xl,
            fontSize: '14px',
          }}
        >
          ← Kitaplara Dön
        </Link>

        <Card style={{ padding: spacing['2xl'] }}>
          <div style={{ display: 'flex', gap: spacing['2xl'], flexWrap: 'wrap' }}>
            {/* Kapak Resmi */}
            <div style={{
              width: '220px',
              height: '320px',
              backgroundColor: colors.bgLight,
              borderRadius: borderRadius.lg,
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src={getCoverUrl(book.isbn, book.coverImage)}
                alt={book.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/220x320/3d3830/d97706?text=${encodeURIComponent(book.title.substring(0, 15))}`;
                }}
              />
            </div>

            {/* Kitap Bilgileri */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: colors.white,
                  marginBottom: spacing.md,
                  lineHeight: 1.2,
                  flex: 1,
                }}>
                  {book.title}
                </h1>
                <button
                  onClick={toggleFavorite}
                  disabled={togglingFavorite}
                  title={isFavorite ? 'Favorilerden kaldır' : 'Favorilere ekle'}
                  aria-label={isFavorite ? 'Favorilerden kaldır' : 'Favorilere ekle'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: togglingFavorite ? 'default' : 'pointer',
                    fontSize: '32px',
                    color: isFavorite ? '#ef4444' : colors.gray,
                    transition: 'all 0.2s',
                    padding: spacing.sm,
                    opacity: togglingFavorite ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!togglingFavorite) {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.color = isFavorite ? '#dc2626' : '#ef4444';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.color = isFavorite ? '#ef4444' : colors.gray;
                  }}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </button>
              </div>

              <p style={{
                fontSize: '20px',
                color: colors.primaryLight,
                marginBottom: spacing.xl,
                fontWeight: 500,
              }}>
                {book.author}
              </p>

              {book.description && (
                <div style={{ marginBottom: spacing['2xl'] }}>
                  <h3 style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Açıklama
                  </h3>
                  <p style={{ color: colors.white, lineHeight: 1.8, fontSize: '16px' }}>
                    {book.description}
                  </p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: spacing.xl, marginBottom: spacing['2xl'] }}>
                <div>
                  <h3 style={{ color: colors.gray, fontSize: '12px', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ISBN
                  </h3>
                  <p style={{ color: colors.white, fontFamily: 'monospace', margin: 0 }}>{book.isbn}</p>
                </div>
                <div>
                  <h3 style={{ color: colors.gray, fontSize: '12px', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Toplam Adet
                  </h3>
                  <p style={{ color: colors.white, margin: 0 }}>{book.quantity}</p>
                </div>
                <div>
                  <h3 style={{ color: colors.gray, fontSize: '12px', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Mevcut
                  </h3>
                  <Badge variant={book.available > 0 ? 'success' : 'danger'}>
                    {book.available > 0 ? `${book.available} adet` : 'Stokta yok'}
                  </Badge>
                </div>
                <div>
                  <h3 style={{ color: colors.gray, fontSize: '12px', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    QR Kod
                  </h3>
                  <Button size="sm" variant="secondary" onClick={() => setShowQR(!showQR)}>
                    {showQR ? 'Gizle' : 'Göster'}
                  </Button>
                </div>
              </div>

              {/* QR Kod */}
              {showQR && (
                <div style={{
                  padding: spacing.lg,
                  backgroundColor: 'white',
                  borderRadius: borderRadius.md,
                  display: 'inline-block',
                  marginBottom: spacing.xl,
                }}>
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_APP_URL}/books/${book.id}`}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                  <p style={{ color: colors.bg, fontSize: '11px', textAlign: 'center', margin: `${spacing.sm} 0 0 0` }}>
                    {book.isbn || book.id.slice(0, 8)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.xl }}>
            {/* Bekleyen sayısı */}
            {waitingCount > 0 && book.available === 0 && (
              <p style={{ color: colors.warning, fontSize: '14px', marginBottom: spacing.md }}>
                🕐 {waitingCount} kişi bu kitabı bekliyor
              </p>
            )}

            <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap', alignItems: 'center' }}>
              {book.available > 0 ? (
                <Button
                  size="lg"
                  disabled={borrowing}
                  onClick={handleBorrow}
                  style={{ padding: '14px 32px' }}
                >
                  {borrowing ? 'İşleniyor...' : 'Ödünç Al'}
                </Button>
              ) : (
                <>
                  {hasReservation ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleCancelReservation}
                      style={{ padding: '14px 32px' }}
                    >
                      Rezervasyonu İptal Et
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="secondary"
                      disabled={reserving}
                      onClick={handleReserve}
                      style={{ padding: '14px 32px' }}
                    >
                      {reserving ? 'İşleniyor...' : 'Rezerve Et'}
                    </Button>
                  )}
                  <span style={{ color: colors.gray, fontSize: '14px' }}>
                    Kitap müsait olduğunda bildirim alacaksınız
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Reviews Section */}
        <Card style={{ padding: spacing['2xl'], marginTop: spacing.xl }}>
          <h2 style={{ color: colors.white, fontSize: '20px', marginBottom: spacing.lg }}>
            Değerlendirmeler
            {reviews.length > 0 && (
              <span style={{ color: colors.gray, fontSize: '14px', marginLeft: spacing.md }}>
                ({reviews.length} yorum, ortalama: ⭐ {averageRating})
              </span>
            )}
          </h2>

          {/* Add/Edit Review */}
          <div style={{ padding: spacing.lg, backgroundColor: colors.bgLight, borderRadius: borderRadius.md, marginBottom: spacing.xl }}>
            <h3 style={{ color: colors.white, fontSize: '16px', marginBottom: spacing.md }}>
              {hasReviewed ? 'Yorumunuzu Düzenleyin' : 'Yorum Yapın'}
            </h3>
            <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.md }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setMyRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '28px',
                    color: star <= myRating ? '#fbbf24' : colors.gray,
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  ★
                </button>
              ))}
              <span style={{ color: colors.gray, marginLeft: spacing.sm, alignSelf: 'center' }}>
                {myRating > 0 ? `${myRating}/5` : 'Puan seçin'}
              </span>
            </div>
            <textarea
              placeholder="Yorumunuz (opsiyonel)..."
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.md,
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                color: colors.white,
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
                marginBottom: spacing.md,
              }}
            />
            <Button onClick={handleSubmitReview} disabled={submittingReview || myRating === 0}>
              {submittingReview ? 'Gönderiliyor...' : hasReviewed ? 'Güncelle' : 'Gönder'}
            </Button>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p style={{ color: colors.gray, textAlign: 'center', padding: spacing.xl }}>
              Henüz yorum yapılmamış. İlk yorumu siz yapın!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: spacing.lg,
                    backgroundColor: colors.bg,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                    <div>
                      <p style={{ color: colors.white, fontWeight: 600, margin: 0 }}>{review.user.name}</p>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>
                        {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{ color: star <= review.rating ? '#fbbf24' : colors.border, fontSize: '16px' }}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p style={{ color: colors.white, fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}
