'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { getHeaders, getJsonHeaders, formatDate } from './utils';
import { PassiveStudent, UserInfo } from './types';

interface AdminPassiveStudentsProps {
  userInfo: UserInfo | null;
  selectedSchoolId: string | null;
  getToken: () => Promise<string | null>;
}

export function AdminPassiveStudents({ userInfo, selectedSchoolId, getToken }: AdminPassiveStudentsProps) {
  const [students, setStudents] = useState<PassiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<PassiveStudent | null>(null);
  const [formData, setFormData] = useState({ name: '', className: '', section: '', studentNumber: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/passive`, { headers });
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData({ name: '', className: '', section: '', studentNumber: '' });
  };

  const handleEdit = (student: PassiveStudent) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      className: student.className || '',
      section: student.section || '',
      studentNumber: student.studentNumber || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const url = editingStudent
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/passive/${editingStudent.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/users/passive`;
      const res = await fetch(url, {
        method: editingStudent ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(editingStudent ? 'Öğrenci güncellendi' : 'Öğrenci eklendi');
        resetForm();
        await fetchStudents();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Bir hata olustu');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/passive/${deleteConfirm.id}`, {
        method: 'DELETE', headers,
      });
      if (res.ok) {
        setStudents(students.filter(s => s.id !== deleteConfirm.id));
        toast.success('Öğrenci silindi');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Silinemedi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setDeleteConfirm(null);
    }
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/passive/import-csv`, {
        method: 'POST', headers, body: JSON.stringify({ csv: text }),
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`${result.success} öğrenci eklendi${result.failed > 0 ? `, ${result.failed} eklenemedi` : ''}`);
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 3).forEach((err: string) => toast.error(err));
        }
        await fetchStudents();
      } else {
        const error = await res.json();
        toast.error(error.message || 'CSV içeri aktarma başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setCsvImporting(false);
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/passive/csv-template`, { headers });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([data.template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error('Sablon indirilemedi');
    }
  };

  const filteredStudents = searchTerm.trim()
    ? students.filter(s => {
        const q = searchTerm.toLowerCase();
        return s.name.toLowerCase().includes(q) ||
          s.className?.toLowerCase().includes(q) ||
          s.section?.toLowerCase().includes(q) ||
          s.studentNumber?.includes(q);
      })
    : students;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: spacing['2xl'] }}>
        <p style={{ color: colors.gray }}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, flexWrap: 'wrap', gap: spacing.md }}>
        <h2 style={{ color: colors.white, fontSize: '24px', margin: 0 }}>Pasif Öğrenci Yönetimi</h2>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: spacing.sm,
            padding: `${spacing.sm} ${spacing.lg}`, backgroundColor: colors.success,
            color: colors.white, borderRadius: borderRadius.md,
            cursor: csvImporting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500,
            opacity: csvImporting ? 0.7 : 1,
          }}>
            <input type="file" accept=".csv" onChange={handleCSVImport} disabled={csvImporting} style={{ display: 'none' }} />
            {csvImporting ? 'İçeri Aktarılıyor...' : 'CSV İçeri Aktar'}
          </label>
          <Button variant="outline" onClick={handleDownloadTemplate}>Şablon İndir</Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>+ Yeni Öğrenci Ekle</Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
          <h3 style={{ color: colors.white, marginBottom: spacing.lg, marginTop: 0 }}>
            {editingStudent ? 'Öğrenci Düzenle' : 'Yeni Pasif Öğrenci Ekle'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg, marginBottom: spacing.lg }}>
              <Input label="Ad Soyad *" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Sınıf *" type="text" value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })} placeholder="9, 10, 11..." required />
              <Input label="Şube *" type="text" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} placeholder="A, B, C..." required />
              <Input label="Okul Numarası *" type="text" value={formData.studentNumber} onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })} placeholder="1001" required />
            </div>
            <div style={{ display: 'flex', gap: spacing.md }}>
              <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : (editingStudent ? 'Güncelle' : 'Kaydet')}</Button>
              <Button type="button" variant="ghost" onClick={resetForm}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Info Card */}
      <Card style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: `${colors.primary}15`, borderColor: colors.primary }}>
        <p style={{ color: colors.gray, margin: 0, fontSize: '13px' }}>
          Pasif öğrenciler sisteme kayıt olmamış öğrencilerdir. Onların adına kitap ödünç verme/iade işlemi yapabilirsiniz.
          Öğrenci ileride sisteme kayıt olursa, okul numarası ile geçmiş kayıtlarını devralır.
        </p>
      </Card>

      {/* Search/Filter */}
      {students.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <Input
            label=""
            type="text"
            placeholder="Öğrenci adı, sınıfı, şubesi veya numarası ile filtrele..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Students Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: spacing['2xl'] }}>
              <p style={{ color: colors.gray, fontSize: '16px' }}>Henüz pasif öğrenci eklenmemiş</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }} style={{ marginTop: spacing.md }}>+ İlk Öğrenciyi Ekle</Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: spacing['2xl'] }}>
              <p style={{ color: colors.gray, fontSize: '14px' }}>Aramayla eşleşen öğrenci bulunamadı</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.bg }}>
                  <th style={{ padding: spacing.lg, textAlign: 'left', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Ad Soyad</th>
                  <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Sınıf</th>
                  <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Şube</th>
                  <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Numara</th>
                  <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Aktif Ödünç</th>
                  <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Eklenme</th>
                  <th style={{ padding: spacing.lg, textAlign: 'right', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={{ padding: spacing.lg }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <span style={{ color: colors.white, fontWeight: 600, fontSize: '14px' }}>{student.name}</span>
                        <Badge variant="warning" style={{ fontSize: '10px' }}>Pasif</Badge>
                      </div>
                    </td>
                    <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.white }}>{student.className}</td>
                    <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.white }}>{student.section}</td>
                    <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.white }}>{student.studentNumber}</td>
                    <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                      <Badge variant={student.activeLoans > 0 ? 'warning' : 'success'}>{student.activeLoans}</Badge>
                    </td>
                    <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontSize: '12px' }}>{formatDate(student.createdAt)}</td>
                    <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                        <Button size="sm" onClick={() => handleEdit(student)}>Düzenle</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteConfirm({ id: student.id, name: student.name })}>Sil</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Öğrenciyi Sil"
        message={`"${deleteConfirm?.name}" öğrencisini silmek istediğinize emin misiniz? Aktif ödüncü varsa silinemez.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />
    </div>
  );
}
