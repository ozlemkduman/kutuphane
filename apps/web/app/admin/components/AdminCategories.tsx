'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { generateSlug, getHeaders, getJsonHeaders } from './utils';
import { Category, UserInfo } from './types';

interface AdminCategoriesProps {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  userInfo: UserInfo | null;
  selectedSchoolId: string | null;
  getToken: () => Promise<string | null>;
}

export function AdminCategories({ categories, setCategories, userInfo, selectedSchoolId, getToken }: AdminCategoriesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ slug: '', name: '', icon: '📚', color: '#6366f1' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const toast = useToast();

  const openForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ slug: category.slug, name: category.name, icon: category.icon, color: category.color });
    } else {
      setEditingCategory(null);
      setCategoryForm({ slug: '', name: '', icon: '📚', color: '#6366f1' });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setCategoryForm({ slug: '', name: '', icon: '📚', color: '#6366f1' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.slug) { toast.error('İsim ve slug zorunlu'); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const url = editingCategory
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${editingCategory.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/categories`;
      const res = await fetch(url, { method: editingCategory ? 'PUT' : 'POST', headers, body: JSON.stringify(categoryForm) });
      if (res.ok) {
        toast.success(editingCategory ? 'Kategori güncellendi' : 'Kategori eklendi');
        closeForm();
        const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
          headers: getHeaders(token, selectedSchoolId, userInfo?.role),
        });
        if (categoriesRes.ok) { setCategories(await categoriesRes.json()); }
      } else {
        const error = await res.json();
        toast.error(error.message || 'Kayıt başarısız');
      }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const token = await getToken();
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${deleteConfirm.id}`, { method: 'DELETE', headers });
      if (res.ok) {
        toast.success('Kategori silindi');
        setCategories(categories.filter((c) => c.id !== deleteConfirm.id));
      } else {
        const error = await res.json();
        toast.error(error.message || 'Silme başarısız');
      }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setDeleteConfirm(null); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
        <h2 style={{ color: colors.white, fontSize: '24px', margin: 0 }}>🏷️ Kategori Yönetimi</h2>
        <Button onClick={() => openForm()}>+ Yeni Kategori</Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
          <h3 style={{ color: colors.white, marginTop: 0, marginBottom: spacing.lg }}>
            {editingCategory ? '✏️ Kategori Düzenle' : '➕ Yeni Kategori'}
          </h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg }}>
              <Input label="Kategori Adı" placeholder="Örn: Roman" value={categoryForm.name}
                onChange={(e) => { const name = e.target.value; setCategoryForm({ ...categoryForm, name, slug: editingCategory ? categoryForm.slug : generateSlug(name) }); }} required />
              <Input label="Slug (URL)" placeholder="Örn: roman" value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} required disabled={!!editingCategory} />
              <Input label="İkon (Emoji)" placeholder="Örn: 📖" value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} />
              <div>
                <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Renk</label>
                <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                  <input type="color" value={categoryForm.color} onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    style={{ width: '50px', height: '42px', border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' }} />
                  <Input value={categoryForm.color} onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: spacing.lg }}>
              <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Önizleme</label>
              <Badge style={{ backgroundColor: categoryForm.color + '20', color: categoryForm.color }}>
                {categoryForm.icon} {categoryForm.name || 'Kategori Adı'}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xl }}>
              <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : (editingCategory ? 'Güncelle' : 'Kaydet')}</Button>
              <Button type="button" variant="ghost" onClick={closeForm}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.lg }}>
        {categories.map((category) => (
          <Card key={category.id} style={{ padding: spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                <div style={{ width: '48px', height: '48px', borderRadius: borderRadius.md, backgroundColor: category.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  {category.icon}
                </div>
                <div>
                  <p style={{ color: colors.white, fontWeight: 600, fontSize: '16px', margin: 0 }}>{category.name}</p>
                  <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>/{category.slug}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <Button size="sm" variant="secondary" onClick={() => openForm(category)}>Düzenle</Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteConfirm({ id: category.id, name: category.name })}>Sil</Button>
              </div>
            </div>
          </Card>
        ))}
        {categories.length === 0 && (
          <Card style={{ padding: spacing.xl, textAlign: 'center' }}>
            <p style={{ color: colors.gray }}>Henüz kategori eklenmemiş</p>
          </Card>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Kategoriyi Sil" message={`"${deleteConfirm?.name}" kategorisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil" cancelText="İptal" variant="danger" />
    </div>
  );
}
