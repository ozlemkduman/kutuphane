// Kitaplar sayfası - Gelişmiş arama ve filtreleme
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, shadows, spacing, transitions } from '@/lib/theme';
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
  categoryId: string | null;
  category: Category | null;
  _count?: { loans: number };
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
}

interface SearchResult {
  books: Book[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SortOption = 'title' | 'author' | 'createdAt' | 'popular';
type AvailabilityFilter = 'all' | 'available' | 'unavailable';

// ISBN'den kapak resmi URL'i oluştur (Open Library API)
const getCoverUrl = (isbn: string, coverImage: string | null) => {
  if (coverImage) return coverImage;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState<string | null>(null);

  // Arama ve filtreleme state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const ITEMS_PER_PAGE = 12;

  const { user, profile, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedCategory, sortBy, sortOrder, availability]);

  // Auth yönlendirmeleri
  useEffect(() => {
    // Auth yüklenene kadar bekle
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
    } else if (profile?.role === 'DEVELOPER') {
      router.replace('/developer');
    } else if (profile?.role === 'MEMBER' && !profile?.schoolId) {
      router.replace('/onboarding/select-school');
    } else if (profile?.role === 'MEMBER' && profile?.status === 'PENDING') {
      router.replace('/pending-approval');
    } else if (profile?.role === 'MEMBER' && profile?.status === 'REJECTED') {
      router.replace('/pending-approval');
    }
  }, [authLoading, user, profile, router]);

  // Kategorileri yükle
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchCategories = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();
  }, [authLoading, user, getToken]);

  // Kitapları ara ve yükle
  const fetchBooks = useCallback(async () => {
    if (authLoading || !user) return;

    setLoading(true);
    try {
      const token = await getToken();

      // URL parametrelerini oluştur
      const params = new URLSearchParams();
      if (debouncedQuery) params.append('q', debouncedQuery);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (availability === 'available') params.append('available', 'true');
      if (availability === 'unavailable') params.append('available', 'false');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/books/search?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (res.ok) {
        const data: SearchResult = await res.json();
        setBooks(data.books);
        setTotalPages(data.pagination.totalPages);
        setTotalBooks(data.pagination.total);
      } else {
        setBooks([]);
      }
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, getToken, debouncedQuery, selectedCategory, availability, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleBorrow = async (bookId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setBorrowing(bookId);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/${bookId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setBooks(books.map(book =>
          book.id === bookId ? { ...book, available: book.available - 1 } : book
        ));
        toast.success('Kitap başarıyla ödünç alındı!');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Bir hata oluştu');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setBorrowing(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('title');
    setSortOrder('asc');
    setAvailability('all');
  };

  const hasActiveFilters = searchQuery || selectedCategory || sortBy !== 'title' || sortOrder !== 'asc' || availability !== 'all';

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main id="main-content" role="main" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['2xl'], flexWrap: 'wrap', gap: spacing.lg }}>
            <Skeleton variant="text" width="150px" height="36px" />
            <Skeleton variant="rounded" width="280px" height="44px" />
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" width="100px" height="36px" />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: spacing.xl }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <Skeleton variant="rounded" height="160px" style={{ marginBottom: spacing.md }} />
                <Card.Content>
                  <Skeleton variant="text" width="85%" style={{ marginBottom: spacing.sm }} />
                  <Skeleton variant="text" width="60%" style={{ marginBottom: spacing.md }} />
                  <Skeleton variant="rounded" width="100%" height="36px" />
                </Card.Content>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main id="main-content" role="main" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, flexWrap: 'wrap', gap: spacing.lg }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: colors.white, margin: 0 }}>
            Kitaplar
          </h1>
          <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Input
                type="text"
                placeholder="Kitap, yazar veya ISBN ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<span style={{ fontSize: '16px' }}>🔍</span>}
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              ⚙️ Filtreler
            </Button>
          </div>
        </div>

        {/* Gelişmiş Filtreler */}
        {showFilters && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: spacing.lg }}>
              {/* Sıralama */}
              <div>
                <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '13px' }}>
                  Sıralama
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    color: colors.white,
                    fontSize: '14px',
                  }}
                >
                  <option value="title">Başlık</option>
                  <option value="author">Yazar</option>
                  <option value="createdAt">Eklenme Tarihi</option>
                  <option value="popular">Popülerlik</option>
                </select>
              </div>

              {/* Sıralama Yönü */}
              <div>
                <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '13px' }}>
                  Sıra
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    color: colors.white,
                    fontSize: '14px',
                  }}
                >
                  <option value="asc">A-Z / Artan</option>
                  <option value="desc">Z-A / Azalan</option>
                </select>
              </div>

              {/* Müsaitlik */}
              <div>
                <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '13px' }}>
                  Müsaitlik
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as AvailabilityFilter)}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    color: colors.white,
                    fontSize: '14px',
                  }}
                >
                  <option value="all">Tümü</option>
                  <option value="available">Sadece Müsait</option>
                  <option value="unavailable">Sadece Tükenen</option>
                </select>
              </div>

              {/* Temizle Butonu */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="ghost" onClick={clearFilters} disabled={!hasActiveFilters}>
                  🗑️ Filtreleri Temizle
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Kategoriler */}
        <div style={{ marginBottom: spacing.xl }}>
          <div style={{
            display: 'flex',
            gap: spacing.sm,
            overflowX: 'auto',
            paddingBottom: spacing.md,
          }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: selectedCategory === '' ? colors.primary : colors.card,
                color: selectedCategory === '' ? colors.white : colors.gray,
                border: `1px solid ${selectedCategory === '' ? colors.primary : colors.border}`,
                borderRadius: borderRadius.full,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedCategory === '' ? 600 : 500,
                whiteSpace: 'nowrap',
                transition: `all ${transitions.normal}`,
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '14px' }}>📚</span>
              Tümü
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: selectedCategory === cat.id ? cat.color : colors.card,
                  color: selectedCategory === cat.id ? colors.white : colors.gray,
                  border: `1px solid ${selectedCategory === cat.id ? cat.color : colors.border}`,
                  borderRadius: borderRadius.full,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: selectedCategory === cat.id ? 600 : 500,
                  whiteSpace: 'nowrap',
                  transition: `all ${transitions.normal}`,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sonuç Bilgisi */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <p style={{ color: colors.gray, fontSize: '14px', margin: 0 }}>
            {loading ? 'Aranıyor...' : `${totalBooks} kitap bulundu`}
            {debouncedQuery && ` • "${debouncedQuery}" araması`}
          </p>
          {hasActiveFilters && (
            <Badge variant="warning">{
              [
                debouncedQuery && 'Arama',
                selectedCategory && 'Kategori',
                availability !== 'all' && 'Müsaitlik',
                (sortBy !== 'title' || sortOrder !== 'asc') && 'Sıralama',
              ].filter(Boolean).length
            } filtre aktif</Badge>
          )}
        </div>

        {/* Kitap Listesi */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: spacing.xl }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <Skeleton variant="rounded" height="160px" style={{ marginBottom: spacing.md }} />
                <Card.Content>
                  <Skeleton variant="text" width="85%" style={{ marginBottom: spacing.sm }} />
                  <Skeleton variant="text" width="60%" style={{ marginBottom: spacing.md }} />
                  <Skeleton variant="rounded" width="100%" height="36px" />
                </Card.Content>
              </Card>
            ))}
          </div>
        ) : books.length === 0 ? (
          <Card style={{ padding: spacing['3xl'], textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: spacing.lg }}>📭</span>
            <p style={{ color: colors.gray, fontSize: '18px', margin: 0 }}>
              {hasActiveFilters ? 'Aramanızla eşleşen kitap bulunamadı.' : 'Henüz kitap eklenmemiş.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} style={{ marginTop: spacing.lg }}>
                Filtreleri Temizle
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: spacing.xl }}>
              {books.map((book) => (
                <Card key={book.id} hoverable style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    height: '160px',
                    backgroundColor: colors.bgLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={getCoverUrl(book.isbn, book.coverImage)}
                      alt={book.title}
                      style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/150x200/3d3830/d97706?text=${encodeURIComponent(book.title.substring(0, 10))}`;
                      }}
                    />
                  </div>
                  <Card.Content style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: spacing.xs, color: colors.white, lineHeight: 1.3 }}>
                      {book.title}
                    </h2>
                    <p style={{ color: colors.primaryLight, marginBottom: spacing.sm, fontWeight: 500, fontSize: '13px' }}>
                      {book.author}
                    </p>
                    <div style={{ marginTop: 'auto' }}>
                      <Badge variant={book.available > 0 ? 'success' : 'danger'} style={{ marginBottom: spacing.md }}>
                        {book.available > 0 ? `${book.available} adet mevcut` : 'Stokta yok'}
                      </Badge>
                      <div style={{ display: 'flex', gap: spacing.sm }}>
                        <Link href={`/books/${book.id}`} style={{ flex: 1 }}>
                          <Button variant="outline" size="sm" style={{ width: '100%' }}>Detay</Button>
                        </Link>
                        <Button
                          size="sm"
                          disabled={book.available === 0 || borrowing === book.id}
                          onClick={() => handleBorrow(book.id)}
                          style={{ flex: 1 }}
                        >
                          {borrowing === book.id ? '...' : 'Ödünç Al'}
                        </Button>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing['2xl'] }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ← Önceki
                </Button>

                <div style={{ display: 'flex', gap: spacing.xs }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: borderRadius.md,
                          border: `1px solid ${currentPage === pageNum ? colors.primary : colors.border}`,
                          backgroundColor: currentPage === pageNum ? colors.primary : 'transparent',
                          color: currentPage === pageNum ? colors.white : colors.gray,
                          cursor: 'pointer',
                          fontWeight: currentPage === pageNum ? 600 : 400,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Sonraki →
                </Button>
              </div>
            )}

            <p style={{ textAlign: 'center', color: colors.gray, fontSize: '14px', marginTop: spacing.md }}>
              Sayfa {currentPage} / {totalPages}
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
