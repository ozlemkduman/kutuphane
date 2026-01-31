// Seed dosyası - Veritabanına örnek veri ekler
// Çalıştırmak için: npx ts-node prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed başlıyor...');

  // ============================================
  // VARSAYILAN OKUL OLUŞTUR
  // ============================================

  const defaultSchool = await prisma.school.upsert({
    where: { slug: 'varsayilan-okul' },
    update: {},
    create: {
      name: 'Varsayılan Okul',
      slug: 'varsayilan-okul',
      email: 'info@varsayilanokul.edu.tr',
      isActive: true,
    },
  });
  console.log('Varsayılan okul oluşturuldu:', defaultSchool.name);

  // ============================================
  // KATEGORİLERİ OLUŞTUR
  // ============================================

  const categoriesData = [
    // Edebiyat
    { slug: 'roman', name: 'Roman', icon: '📖', color: '#ef4444' },
    { slug: 'siir', name: 'Şiir', icon: '✨', color: '#ec4899' },
    { slug: 'oyku', name: 'Öykü', icon: '📝', color: '#f97316' },
    { slug: 'klasik', name: 'Klasikler', icon: '🏛️', color: '#8b5cf6' },
    // Okul & Eğitim
    { slug: 'ders', name: 'Ders Kitapları', icon: '📕', color: '#3b82f6' },
    { slug: 'matematik', name: 'Matematik', icon: '🔢', color: '#06b6d4' },
    { slug: 'fen', name: 'Fen Bilimleri', icon: '🔬', color: '#10b981' },
    { slug: 'tarih', name: 'Tarih', icon: '🏺', color: '#f59e0b' },
    { slug: 'cografya', name: 'Coğrafya', icon: '🌍', color: '#22c55e' },
    { slug: 'turkce', name: 'Türkçe', icon: '🇹🇷', color: '#ef4444' },
    { slug: 'ingilizce', name: 'İngilizce', icon: '🇬🇧', color: '#3b82f6' },
    { slug: 'sinav', name: 'Sınav Hazırlık', icon: '📋', color: '#8b5cf6' },
    // Bilim & Teknoloji
    { slug: 'bilim', name: 'Popüler Bilim', icon: '🧪', color: '#14b8a6' },
    { slug: 'teknoloji', name: 'Teknoloji', icon: '💻', color: '#6366f1' },
    { slug: 'bilimkurgu', name: 'Bilim Kurgu', icon: '🚀', color: '#0ea5e9' },
    // Kişisel Gelişim
    { slug: 'kisisel', name: 'Kişisel Gelişim', icon: '🌱', color: '#22c55e' },
    { slug: 'psikoloji', name: 'Psikoloji', icon: '🧠', color: '#a855f7' },
    { slug: 'felsefe', name: 'Felsefe', icon: '🤔', color: '#64748b' },
    // Diğer
    { slug: 'cocuk', name: 'Çocuk Kitapları', icon: '🎈', color: '#f472b6' },
    { slug: 'genc', name: 'Genç Yetişkin', icon: '🎯', color: '#fb923c' },
    { slug: 'polisiye', name: 'Polisiye', icon: '🔍', color: '#475569' },
    { slug: 'fantastik', name: 'Fantastik', icon: '🐉', color: '#7c3aed' },
    { slug: 'biyografi', name: 'Biyografi', icon: '👤', color: '#0d9488' },
    { slug: 'sanat', name: 'Sanat', icon: '🎨', color: '#e11d48' },
    { slug: 'spor', name: 'Spor', icon: '⚽', color: '#65a30d' },
    { slug: 'yemek', name: 'Yemek', icon: '🍳', color: '#ea580c' },
    { slug: 'gezi', name: 'Gezi', icon: '✈️', color: '#0284c7' },
    { slug: 'din', name: 'Din & Maneviyat', icon: '🕌', color: '#059669' },
  ];

  // Kategorileri ekle (varsa atla)
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { schoolId_slug: { schoolId: defaultSchool.id, slug: cat.slug } },
      update: {},
      create: {
        ...cat,
        schoolId: defaultSchool.id,
      },
    });
  }
  console.log(`${categoriesData.length} kategori oluşturuldu/güncellendi`);

  // Kategorileri al
  const romanKategori = await prisma.category.findFirst({ where: { slug: 'roman', schoolId: defaultSchool.id } });
  const klasikKategori = await prisma.category.findFirst({ where: { slug: 'klasik', schoolId: defaultSchool.id } });
  const bilimkurguKategori = await prisma.category.findFirst({ where: { slug: 'bilimkurgu', schoolId: defaultSchool.id } });
  const felsefeKategori = await prisma.category.findFirst({ where: { slug: 'felsefe', schoolId: defaultSchool.id } });
  const kisiselKategori = await prisma.category.findFirst({ where: { slug: 'kisisel', schoolId: defaultSchool.id } });
  const cocukKategori = await prisma.category.findFirst({ where: { slug: 'cocuk', schoolId: defaultSchool.id } });

  // ============================================
  // KULLANICILARI OLUŞTUR
  // ============================================

  // Admin kullanıcı
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kutuphane.com' },
    update: { schoolId: defaultSchool.id },
    create: {
      firebaseUid: 'admin-firebase-uid-123',
      email: 'admin@kutuphane.com',
      name: 'Admin Kullanıcı',
      role: 'ADMIN',
      schoolId: defaultSchool.id,
      isMainAdmin: true,
    },
  });
  console.log('Admin oluşturuldu:', admin.email);

  // Normal üye
  const member = await prisma.user.upsert({
    where: { email: 'ayse@example.com' },
    update: { schoolId: defaultSchool.id },
    create: {
      firebaseUid: 'member-firebase-uid-456',
      email: 'ayse@example.com',
      name: 'Ayşe Yılmaz',
      role: 'MEMBER',
      schoolId: defaultSchool.id,
    },
  });
  console.log('Üye oluşturuldu:', member.email);

  // ============================================
  // KİTAPLARI OLUŞTUR (KATEGORİLERLE)
  // ============================================

  const booksData = [
    {
      title: 'Suç ve Ceza',
      author: 'Fyodor Dostoyevski',
      isbn: '9780143058144',
      description: 'Rus edebiyatının başyapıtlarından biri.',
      quantity: 3,
      categoryId: klasikKategori?.id,
    },
    {
      title: 'Sefiller',
      author: 'Victor Hugo',
      isbn: '9780451419439',
      description: 'Jean Valjean\'ın hikayesi.',
      quantity: 2,
      categoryId: klasikKategori?.id,
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '9780451524935',
      description: 'Distopik bir gelecekte geçen roman.',
      quantity: 4,
      categoryId: bilimkurguKategori?.id,
    },
    {
      title: 'Hayvan Çiftliği',
      author: 'George Orwell',
      isbn: '9780451526342',
      description: 'Politik bir alegori.',
      quantity: 2,
      categoryId: klasikKategori?.id,
    },
    {
      title: 'Dönüşüm',
      author: 'Franz Kafka',
      isbn: '9780553213690',
      description: 'Gregor Samsa bir sabah böceğe dönüşür.',
      quantity: 2,
      categoryId: felsefeKategori?.id,
    },
    {
      title: 'Simyacı',
      author: 'Paulo Coelho',
      isbn: '9780062315007',
      description: 'Santiago\'nun hazine arayışı.',
      quantity: 3,
      categoryId: kisiselKategori?.id,
    },
    {
      title: 'Küçük Prens',
      author: 'Antoine de Saint-Exupéry',
      isbn: '9780156012195',
      description: 'Bir çocuğun gözünden hayat.',
      quantity: 5,
      categoryId: cocukKategori?.id,
    },
    {
      title: 'Fareler ve İnsanlar',
      author: 'John Steinbeck',
      isbn: '9780142000670',
      description: 'George ve Lennie\'nin dostluğu.',
      quantity: 2,
      categoryId: romanKategori?.id,
    },
  ];

  // Kitapları ekle (varsa güncelle)
  for (const book of booksData) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: { categoryId: book.categoryId, schoolId: defaultSchool.id },
      create: {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description,
        quantity: book.quantity,
        available: book.quantity,
        categoryId: book.categoryId,
        schoolId: defaultSchool.id,
      },
    });
  }
  console.log(`${booksData.length} kitap oluşturuldu/güncellendi`);

  // ============================================
  // ÖRNEK ÖDÜNÇ KAYDI
  // ============================================

  // Önce bir kitabı bulalım
  const firstBook = await prisma.book.findFirst({
    where: { title: 'Suç ve Ceza', schoolId: defaultSchool.id },
  });

  if (firstBook) {
    // Mevcut aktif ödünç var mı kontrol et
    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId: member.id,
        bookId: firstBook.id,
        status: 'ACTIVE',
      },
    });

    if (!existingLoan) {
      // Ayşe bir kitap ödünç alsın
      await prisma.loan.create({
        data: {
          userId: member.id,
          bookId: firstBook.id,
          schoolId: defaultSchool.id,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 gün sonra
        },
      });

      // Kitabın available sayısını azalt
      await prisma.book.update({
        where: { id: firstBook.id },
        data: { available: firstBook.available - 1 },
      });

      console.log('Örnek ödünç kaydı oluşturuldu');
    }
  }

  console.log('Seed tamamlandı!');
}

// Çalıştır
main()
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
