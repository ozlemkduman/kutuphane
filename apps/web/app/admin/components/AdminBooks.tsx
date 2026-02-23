'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { getHeaders, getJsonHeaders } from './utils';
import { Book, Category, UserInfo } from './types';

interface AdminBooksProps {
  books: Book[];
  setBooks: (books: Book[]) => void;
  categories: Category[];
  userInfo: UserInfo | null;
  selectedSchoolId: string | null;
  getToken: () => Promise<string | null>;
}

export function AdminBooks({ books, setBooks, categories, userInfo, selectedSchoolId, getToken }: AdminBooksProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', description: '', quantity: 1, categoryId: '', coverImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [qrBook, setQrBook] = useState<Book | null>(null);
  const toast = useToast();

  const resetForm = () => {
    setShowForm(false);
    setEditingBook(null);
    setFormData({ title: '', author: '', isbn: '', description: '', quantity: 1, categoryId: '', coverImage: '' });
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title, author: book.author, isbn: book.isbn || '',
      description: book.description || '', quantity: book.quantity,
      categoryId: book.categoryId || '', coverImage: book.coverImage || '',
    });
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST', headers, body: formDataUpload,
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, coverImage: `${process.env.NEXT_PUBLIC_API_URL}${data.url}` });
      } else { toast.error('Dosya yüklenemedi'); }
    } catch { toast.error('Dosya yükleme hatası'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const url = editingBook
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/books/${editingBook.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/books`;
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(url, {
        method: editingBook ? 'PUT' : 'POST', headers, body: JSON.stringify(formData),
      });
      if (res.ok) {
        const book = await res.json();
        if (editingBook) { setBooks(books.map((b) => (b.id === book.id ? book : b))); }
        else { setBooks([book, ...books]); }
        resetForm();
      } else { toast.error('Bir hata oluştu'); }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/${deleteConfirm.id}`, {
        method: 'DELETE', headers,
      });
      if (res.ok) {
        setBooks(books.filter((b) => b.id !== deleteConfirm.id));
        toast.success('Kitap başarıyla silindi');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Silinemedi');
      }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setDeleteConfirm(null); }
  };

  const handleBulkDelete = async () => {
    if (selectedBooks.length === 0) return;
    setBulkDeleting(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/bulk-delete`, {
        method: 'POST', headers, body: JSON.stringify({ bookIds: selectedBooks }),
      });
      if (res.ok) {
        const result = await res.json();
        setBooks(books.filter((b) => !selectedBooks.includes(b.id)));
        setSelectedBooks([]);
        toast.success(`${result.success} kitap silindi${result.failed > 0 ? `, ${result.failed} silinemedi` : ''}`);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Toplu silme başarısız');
      }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setBulkDeleting(false); }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const text = await file.text();
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/import-csv`, {
        method: 'POST', headers, body: JSON.stringify({ csv: text }),
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`${result.imported} kitap başarıyla eklendi`);
        const booksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books`, {
          headers: getHeaders(token, selectedSchoolId, userInfo?.role),
        });
        if (booksRes.ok) { setBooks(await booksRes.json()); }
      } else {
        const error = await res.json();
        toast.error(error.message || 'CSV import başarısız');
      }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setCsvImporting(false); e.target.value = ''; }
  };

  const handleDownloadTemplate = () => {
    const template = 'title,author,isbn,quantity,description\n"Örnek Kitap","Yazar Adı","9781234567890",5,"Kitap açıklaması"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kitap_import_sablonu.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintQR = () => {
    if (!qrBook) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Kod - ${qrBook.title}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .qr-container { text-align: center; padding: 20px; border: 2px solid #ddd; border-radius: 8px; }
            h1 { font-size: 18px; margin: 0 0 5px 0; }
            p { font-size: 14px; color: #666; margin: 0 0 15px 0; }
            .isbn { font-family: monospace; font-size: 12px; margin-top: 10px; }
            @media print { body { padding: 0; } .qr-container { border: none; } }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${qrBook.title}</h1>
            <p>${qrBook.author}</p>
            <div id="qr"></div>
            <p class="isbn">ISBN: ${qrBook.isbn || 'N/A'}</p>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.createElement('canvas'), '${typeof window !== 'undefined' ? window.location.origin : ''}/books/${qrBook.id}', { width: 200 }, function(error, canvas) {
              if (!error) { document.getElementById('qr').appendChild(canvas); setTimeout(() => window.print(), 500); }
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, flexWrap: 'wrap', gap: spacing.md }}>
        <h2 style={{ color: colors.white, fontSize: '24px', margin: 0 }}>📚 Kitap Yönetimi</h2>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: spacing.sm,
            padding: `${spacing.sm} ${spacing.lg}`, backgroundColor: colors.success,
            color: colors.white, borderRadius: borderRadius.md,
            cursor: csvImporting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500,
            opacity: csvImporting ? 0.7 : 1,
          }}>
            <input type="file" accept=".csv" onChange={handleCSVImport} disabled={csvImporting} style={{ display: 'none' }} />
            {csvImporting ? '⏳ İçe Aktarılıyor...' : '📥 CSV İçe Aktar'}
          </label>
          <Button variant="outline" onClick={handleDownloadTemplate}>📄 Şablon İndir</Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>+ Yeni Kitap Ekle</Button>
        </div>
      </div>

      {/* Book Form */}
      {showForm && (
        <Card style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
          <h3 style={{ color: colors.white, marginBottom: spacing.lg, marginTop: 0 }}>{editingBook ? 'Kitap Düzenle' : 'Yeni Kitap Ekle'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg, marginBottom: spacing.lg }}>
              <Input label="Başlık *" type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              <Input label="Yazar *" type="text" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} required />
              <Input label="ISBN (opsiyonel)" type="text" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} placeholder="978-xxx-xxx-xxxx" />
              <Input label="Adet" type="number" value={formData.quantity.toString()} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} min={1} />
              <div>
                <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Kategori</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{ width: '100%', padding: spacing.md, backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, color: colors.white, boxSizing: 'border-box' }}
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Açıklama</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: spacing.md, backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, color: colors.white, boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Kapak Resmi</label>
              <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: spacing.sm, padding: `${spacing.md} ${spacing.lg}`,
                  backgroundColor: colors.bg, border: `2px dashed ${colors.border}`, borderRadius: borderRadius.md,
                  cursor: uploading ? 'not-allowed' : 'pointer', color: colors.gray,
                }}>
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
                  {uploading ? '⏳ Yükleniyor...' : '📷 Fotoğraf Seç'}
                </label>
                {formData.coverImage && (
                  <div style={{ position: 'relative' }}>
                    <img src={formData.coverImage} alt="Önizleme" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: borderRadius.sm }} />
                    <button type="button" onClick={() => setFormData({ ...formData, coverImage: '' })}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: colors.error, color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}>×</button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: spacing.md }}>
              <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : (editingBook ? 'Güncelle' : 'Kaydet')}</Button>
              <Button type="button" variant="ghost" onClick={resetForm}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedBooks.length > 0 && (
        <Card style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.warning + '15', borderColor: colors.warning }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md }}>
            <span style={{ color: colors.white, fontWeight: 500 }}>{selectedBooks.length} kitap seçildi</span>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button size="sm" variant="outline" onClick={() => setSelectedBooks([])}>Seçimi Kaldır</Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? '⏳ Siliniyor...' : `🗑️ Seçilenleri Sil (${selectedBooks.length})`}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Books Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: colors.bg }}>
                <th style={{ padding: spacing.lg, textAlign: 'center', width: '40px' }}>
                  <input type="checkbox" checked={selectedBooks.length === books.length && books.length > 0}
                    onChange={(e) => { if (e.target.checked) { setSelectedBooks(books.map((b) => b.id)); } else { setSelectedBooks([]); } }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }} aria-label="Tümünü seç" />
                </th>
                <th style={{ padding: spacing.lg, textAlign: 'left', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Kitap</th>
                <th style={{ padding: spacing.lg, textAlign: 'left', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Kategori</th>
                <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Stok</th>
                <th style={{ padding: spacing.lg, textAlign: 'right', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: selectedBooks.includes(book.id) ? colors.primary + '10' : 'transparent' }}>
                  <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedBooks.includes(book.id)}
                      onChange={(e) => { if (e.target.checked) { setSelectedBooks([...selectedBooks, book.id]); } else { setSelectedBooks(selectedBooks.filter((id) => id !== book.id)); } }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }} aria-label={`${book.title} seç`} />
                  </td>
                  <td style={{ padding: spacing.lg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      {book.coverImage && <img src={book.coverImage} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: borderRadius.sm }} />}
                      <div>
                        <p style={{ color: colors.white, fontWeight: 600, fontSize: '14px', margin: 0 }}>{book.title}</p>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: spacing.lg }}>
                    {book.category && (
                      <Badge style={{ backgroundColor: book.category.color + '20', color: book.category.color }}>
                        {book.category.icon} {book.category.name}
                      </Badge>
                    )}
                  </td>
                  <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                    <Badge variant={book.available > 0 ? 'success' : 'danger'}>{book.available}/{book.quantity}</Badge>
                  </td>
                  <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                      <Button size="sm" variant="secondary" onClick={() => setQrBook(book)} title="QR Kod">📱</Button>
                      <Button size="sm" onClick={() => handleEdit(book)}>Düzenle</Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteConfirm({ id: book.id, title: book.title })}>Sil</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Kitabı Sil"
        message={`"${deleteConfirm?.title}" kitabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />

      {/* QR Code Modal */}
      {qrBook && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setQrBook(null)}>
          <Card style={{ padding: spacing.xl, textAlign: 'center', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: colors.white, marginTop: 0 }}>{qrBook.title}</h3>
            <p style={{ color: colors.gray }}>{qrBook.author}</p>
            <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/books/${qrBook.id}`} size={200} style={{ margin: '0 auto' }} />
            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', marginTop: spacing.lg }}>
              <Button onClick={handlePrintQR}>🖨️ Yazdır</Button>
              <Button variant="ghost" onClick={() => setQrBook(null)}>Kapat</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
