// Okuma Geçmişi Sayfası
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverImage: string | null;
  category: Category | null;
}

interface Loan {
  id: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'ACTIVE' | 'RETURNED';
  renewCount: number;
  fineAmount: number;
  finePaid: boolean;
  book: Book;
}

interface ReadingHistory {
  stats: {
    totalLoans: number;
    completedLoans: number;
    activeLoans: number;
    overdueCount: number;
    totalFines: number;
    unpaidFines: number;
  };
  topCategories: { name: string; count: number; color: string }[];
  monthlyStats: { month: string; count: number }[];
  loans: Loan[];
}

export default function MyLoansPage() {
  const [data, setData] = useState<ReadingHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'returned'>('all');
  const [returning, setReturning] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);
  const { user, profile, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role === 'DEVELOPER') {
        router.push('/developer');
      } else if (profile?.role === 'MEMBER' && !profile?.schoolId) {
        router.push('/onboarding/select-school');
      } else if (profile?.role === 'MEMBER' && profile?.status === 'PENDING') {
        router.push('/pending-approval');
      } else if (profile?.role === 'MEMBER' && profile?.status === 'REJECTED') {
        router.push('/pending-approval');
      }
    }
  }, [authLoading, user, profile, router]);

  const fetchHistory = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        setLoading(false);
        return;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/reading-history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        const error = await res.json().catch(() => ({}));
        console.error('API Error:', error);
        toast.error(error.message || 'Veri yüklenemedi');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleReturn = async (loanId: string) => {
    setReturning(loanId);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/${loanId}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Kitap iade edildi');
        fetchHistory();
      } else {
        const error = await res.json();
        toast.error(error.message || 'İade başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setReturning(null);
    }
  };

  const handleRenew = async (loanId: string) => {
    setRenewing(loanId);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/${loanId}/renew`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Süre uzatıldı');
        fetchHistory();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Süre uzatma başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setRenewing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (loan: Loan) => {
    return loan.status === 'ACTIVE' && new Date(loan.dueDate) < new Date();
  };

  const getDaysLeft = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredLoans = data?.loans.filter((loan) => {
    if (filter === 'active') return loan.status === 'ACTIVE';
    if (filter === 'returned') return loan.status === 'RETURNED';
    return true;
  }) || [];

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main id="main-content" role="main" aria-label="Okuma Geçmişim" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: spacing.xl, width: '100%', boxSizing: 'border-box' }}>
          <Skeleton variant="text" width="200px" height="32px" style={{ marginBottom: spacing.xl }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.lg, marginBottom: spacing.xl }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height="100px" />
            ))}
          </div>
          <Skeleton variant="rounded" height="300px" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !data) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main id="main-content" role="main" aria-label="Okuma Geçmişim" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: spacing.xl, width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ color: colors.white, fontSize: '28px', fontWeight: 700, marginBottom: spacing.xl }}>
          Okuma Geçmişim
        </h1>

        {/* İstatistik Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.lg, marginBottom: spacing.xl }}>
          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <p style={{ color: colors.gray, fontSize: '13px', margin: 0, marginBottom: spacing.sm }}>Toplam</p>
            <p style={{ color: colors.primary, fontSize: '32px', fontWeight: 700, margin: 0 }}>{data.stats.totalLoans}</p>
            <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>kitap</p>
          </Card>
          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <p style={{ color: colors.gray, fontSize: '13px', margin: 0, marginBottom: spacing.sm }}>Tamamlanan</p>
            <p style={{ color: colors.success, fontSize: '32px', fontWeight: 700, margin: 0 }}>{data.stats.completedLoans}</p>
            <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>kitap</p>
          </Card>
          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <p style={{ color: colors.gray, fontSize: '13px', margin: 0, marginBottom: spacing.sm }}>Aktif</p>
            <p style={{ color: colors.warning, fontSize: '32px', fontWeight: 700, margin: 0 }}>{data.stats.activeLoans}</p>
            <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>kitap</p>
          </Card>
          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <p style={{ color: colors.gray, fontSize: '13px', margin: 0, marginBottom: spacing.sm }}>Gecikmiş</p>
            <p style={{ color: data.stats.overdueCount > 0 ? colors.error : colors.success, fontSize: '32px', fontWeight: 700, margin: 0 }}>{data.stats.overdueCount}</p>
            <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>kitap</p>
          </Card>
        </div>

        {/* Ceza Bilgisi */}
        {data.stats.unpaidFines > 0 && (
          <Card style={{ padding: spacing.lg, marginBottom: spacing.xl, backgroundColor: colors.error + '10', borderColor: colors.error }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: colors.error, fontWeight: 600, margin: 0 }}>Ödenmemiş Ceza</p>
                <p style={{ color: colors.gray, fontSize: '14px', margin: 0 }}>Toplam gecikme cezanız</p>
              </div>
              <p style={{ color: colors.error, fontSize: '28px', fontWeight: 700, margin: 0 }}>{data.stats.unpaidFines.toFixed(2)} TL</p>
            </div>
          </Card>
        )}

        {/* En Çok Okunan Kategoriler */}
        {data.topCategories.length > 0 && (
          <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
            <h3 style={{ color: colors.white, fontSize: '16px', margin: 0, marginBottom: spacing.lg }}>En Çok Okuduğum Kategoriler</h3>
            <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
              {data.topCategories.map((cat, i) => (
                <Badge key={i} style={{ backgroundColor: cat.color + '20', color: cat.color, padding: `${spacing.sm} ${spacing.md}` }}>
                  {cat.name} ({cat.count})
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Aylık İstatistik (Basit bar chart) */}
        {data.monthlyStats.some((m) => m.count > 0) && (
          <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
            <h3 style={{ color: colors.white, fontSize: '16px', margin: 0, marginBottom: spacing.lg }}>Son 12 Ay Okuma Aktivitesi</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacing.xs, height: '100px' }}>
              {data.monthlyStats.map((stat, i) => {
                const maxCount = Math.max(...data.monthlyStats.map((s) => s.count), 1);
                const height = (stat.count / maxCount) * 80 + 10;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${height}px`,
                        backgroundColor: stat.count > 0 ? colors.primary : colors.border,
                        borderRadius: borderRadius.sm,
                        marginBottom: spacing.xs,
                      }}
                      title={`${stat.count} kitap`}
                    />
                    <span style={{ color: colors.gray, fontSize: '10px' }}>{stat.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Filtre */}
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg }}>
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tümü ({data.loans.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Aktif ({data.stats.activeLoans})
          </Button>
          <Button
            variant={filter === 'returned' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('returned')}
          >
            Tamamlanan ({data.stats.completedLoans})
          </Button>
        </div>

        {/* Kitap Listesi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {filteredLoans.length === 0 ? (
            <Card style={{ padding: spacing.xl, textAlign: 'center' }}>
              <p style={{ color: colors.gray }}>Henüz kayıt yok</p>
            </Card>
          ) : (
            filteredLoans.map((loan) => {
              const overdue = isOverdue(loan);
              const daysLeft = getDaysLeft(loan.dueDate);
              return (
                <Card key={loan.id} style={{ padding: spacing.lg }}>
                  <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Kitap Kapağı */}
                    <Link href={`/books/${loan.book.id}`}>
                      <div style={{
                        width: '60px',
                        height: '85px',
                        backgroundColor: colors.bgLight,
                        borderRadius: borderRadius.sm,
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}>
                        <img
                          src={loan.book.coverImage || `https://covers.openlibrary.org/b/isbn/${loan.book.isbn}-M.jpg`}
                          alt={loan.book.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://via.placeholder.com/60x85/3d3830/d97706?text=${encodeURIComponent(loan.book.title.substring(0, 10))}`;
                          }}
                        />
                      </div>
                    </Link>

                    {/* Kitap Bilgileri */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <Link href={`/books/${loan.book.id}`} style={{ textDecoration: 'none' }}>
                        <h4 style={{ color: colors.white, margin: 0, marginBottom: spacing.xs }}>{loan.book.title}</h4>
                      </Link>
                      <p style={{ color: colors.gray, fontSize: '14px', margin: 0, marginBottom: spacing.sm }}>{loan.book.author}</p>
                      {loan.book.category && (
                        <Badge style={{ backgroundColor: loan.book.category.color + '20', color: loan.book.category.color }}>
                          {loan.book.category.icon} {loan.book.category.name}
                        </Badge>
                      )}
                    </div>

                    {/* Tarihler */}
                    <div style={{ minWidth: '150px' }}>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Ödünç Tarihi</p>
                      <p style={{ color: colors.white, fontSize: '14px', margin: 0, marginBottom: spacing.sm }}>{formatDate(loan.borrowedAt)}</p>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Teslim Tarihi</p>
                      <p style={{ color: overdue ? colors.error : colors.white, fontSize: '14px', margin: 0 }}>
                        {formatDate(loan.dueDate)}
                        {loan.status === 'ACTIVE' && (
                          <span style={{ color: overdue ? colors.error : colors.success, marginLeft: spacing.xs }}>
                            ({overdue ? `${Math.abs(daysLeft)} gün gecikmiş` : `${daysLeft} gün kaldı`})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Durum ve İşlemler */}
                    <div style={{ textAlign: 'right', minWidth: '140px' }}>
                      <Badge variant={loan.status === 'RETURNED' ? 'success' : overdue ? 'danger' : 'warning'} style={{ marginBottom: spacing.sm }}>
                        {loan.status === 'RETURNED' ? 'İade Edildi' : overdue ? 'Gecikmiş' : 'Aktif'}
                      </Badge>
                      {loan.renewCount > 0 && (
                        <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{loan.renewCount}x yenilenmiş</p>
                      )}
                      {loan.fineAmount > 0 && (
                        <p style={{ color: loan.finePaid ? colors.success : colors.error, fontSize: '12px', margin: 0, marginTop: spacing.xs }}>
                          Ceza: {loan.fineAmount.toFixed(2)} TL {loan.finePaid && '(Ödendi)'}
                        </p>
                      )}
                      {loan.status === 'ACTIVE' && (
                        <div style={{ display: 'flex', gap: spacing.xs, marginTop: spacing.sm, justifyContent: 'flex-end' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRenew(loan.id)}
                            disabled={renewing === loan.id || overdue}
                            title={overdue ? 'Gecikmiş kitaplar yenilenemez' : undefined}
                          >
                            {renewing === loan.id ? '...' : 'Uzat'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReturn(loan.id)}
                            disabled={returning === loan.id}
                          >
                            {returning === loan.id ? '...' : 'İade'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
