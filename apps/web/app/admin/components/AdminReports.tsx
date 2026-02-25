'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { formatDate, getHeaders } from './utils';
import { Book, NeverBorrowedMember, UserInfo } from './types';

interface AdminReportsProps {
  popularBooks: Book[];
  neverBorrowed: Book[];
  lowStock: Book[];
  neverBorrowedMembers: NeverBorrowedMember[];
  userInfo: UserInfo | null;
  selectedSchoolId: string | null;
  getToken: () => Promise<string | null>;
}

export function AdminReports({ popularBooks, neverBorrowed, lowStock, neverBorrowedMembers, userInfo, selectedSchoolId, getToken }: AdminReportsProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const toast = useToast();

  const handleExport = async (type: 'books' | 'members' | 'loans' | 'overdue' | 'member-activity') => {
    setExporting(type);
    try {
      const token = await getToken();
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/export/${type}`, { headers });
      if (res.ok) {
        const result = await res.json();
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Dosya indirildi');
      } else { toast.error('Export başarısız'); }
    } catch { toast.error('Export hatası'); }
    finally { setExporting(null); }
  };

  return (
    <div>
      <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>📈 Raporlar</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))', gap: spacing.xl }}>
        {/* Popular Books */}
        <Card>
          <Card.Header><Card.Title>🏆 En Çok Ödünç Alınan</Card.Title></Card.Header>
          <Card.Content>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {popularBooks.slice(0, 5).map((book, i) => (
                <div key={book.id || `popular-${i}`} style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: i === 0 ? colors.primary : colors.gray, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{book.title}</p>
                    <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{book.author}</p>
                  </div>
                  <Badge variant="warning">{book.loanCount}x</Badge>
                </div>
              ))}
              {popularBooks.length === 0 && <p style={{ color: colors.gray, textAlign: 'center', padding: spacing.lg }}>Henüz veri yok</p>}
            </div>
          </Card.Content>
        </Card>

        {/* Never Borrowed */}
        <Card>
          <Card.Header><Card.Title>📕 Hiç Ödünç Alınmayan</Card.Title></Card.Header>
          <Card.Content style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {neverBorrowed.map((book) => (
                <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                  <span style={{ fontSize: '20px' }}>📖</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{book.title}</p>
                    <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{book.author}</p>
                  </div>
                </div>
              ))}
              {neverBorrowed.length === 0 && <p style={{ color: colors.success, textAlign: 'center', padding: spacing.lg }}>✓ Tüm kitaplar en az bir kez ödünç alınmış</p>}
            </div>
          </Card.Content>
        </Card>

        {/* Low Stock */}
        <Card>
          <Card.Header><Card.Title>📉 Stokta Az Kalan</Card.Title></Card.Header>
          <Card.Content style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {lowStock.map((book) => (
                <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                  <Badge variant={book.available === 0 ? 'danger' : 'warning'}>{book.available}/{book.quantity}</Badge>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{book.title}</p>
                    <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{book.author}</p>
                  </div>
                </div>
              ))}
              {lowStock.length === 0 && <p style={{ color: colors.success, textAlign: 'center', padding: spacing.lg }}>✓ Tüm kitaplar stokta mevcut</p>}
            </div>
          </Card.Content>
        </Card>

        {/* Never Borrowed Members */}
        <Card>
          <Card.Header><Card.Title>👤 Hiç Kitap Almayan Üyeler</Card.Title></Card.Header>
          <Card.Content style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {neverBorrowedMembers.map((member) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                  <span style={{ fontSize: '20px' }}>{member.role === 'ADMIN' ? '👑' : '👤'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{member.name}</p>
                    <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{member.email}</p>
                  </div>
                  <span style={{ color: colors.gray, fontSize: '11px' }}>{formatDate(member.createdAt)}</span>
                </div>
              ))}
              {neverBorrowedMembers.length === 0 && <p style={{ color: colors.success, textAlign: 'center', padding: spacing.lg }}>✓ Tüm üyeler en az bir kitap ödünç almış</p>}
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Export Section */}
      <Card style={{ marginTop: spacing.xl }}>
        <Card.Header><Card.Title>📥 Veri Dışa Aktarma (CSV)</Card.Title></Card.Header>
        <Card.Content>
          <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.lg }}>
            Aşağıdaki butonları kullanarak verilerinizi CSV formatında indirebilirsiniz.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
            {[
              { type: 'books' as const, label: '📚 Kitap Listesi' },
              { type: 'members' as const, label: '👥 Üye Listesi' },
              { type: 'loans' as const, label: '📖 Ödünç İşlemleri' },
              { type: 'overdue' as const, label: '⚠️ Gecikmiş Ödünçler' },
              { type: 'member-activity' as const, label: '📊 Üye Aktivite Raporu' },
            ].map(({ type, label }) => (
              <Button key={type} variant="secondary" onClick={() => handleExport(type)} disabled={exporting !== null}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
                {exporting === type ? '⏳ İndiriliyor...' : label}
              </Button>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
