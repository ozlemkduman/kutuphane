// Mevcut verileri çoklu okul sistemine taşıma script'i
// Bu script bir kez çalıştırılmalıdır

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Çoklu okul migrasyonu başlıyor...');

  // 1. Varsayılan okul oluştur
  console.log('1. Varsayılan okul oluşturuluyor...');
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
  console.log(`   Okul oluşturuldu: ${defaultSchool.name} (${defaultSchool.id})`);

  // 2. Tüm kullanıcıları varsayılan okula ata
  console.log('2. Kullanıcılar varsayılan okula atanıyor...');
  const usersWithoutSchool = await prisma.user.findMany({
    where: { schoolId: null },
  });

  for (const user of usersWithoutSchool) {
    await prisma.user.update({
      where: { id: user.id },
      data: { schoolId: defaultSchool.id },
    });
  }
  console.log(`   ${usersWithoutSchool.length} kullanıcı atandı`);

  // 3. İlk admin'i isMainAdmin yap
  console.log('3. Ana admin atanıyor...');
  const firstAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN', schoolId: defaultSchool.id },
    orderBy: { createdAt: 'asc' },
  });

  if (firstAdmin) {
    await prisma.user.update({
      where: { id: firstAdmin.id },
      data: { isMainAdmin: true },
    });
    console.log(`   Ana admin: ${firstAdmin.name} (${firstAdmin.email})`);
  } else {
    console.log('   Admin bulunamadı, atlanıyor...');
  }

  // 4. Tüm kategorileri varsayılan okula ata
  console.log('4. Kategoriler varsayılan okula atanıyor...');
  const categoriesWithoutSchool = await prisma.category.findMany({
    where: { schoolId: null as any },
  });

  for (const category of categoriesWithoutSchool) {
    await prisma.category.update({
      where: { id: category.id },
      data: { schoolId: defaultSchool.id },
    });
  }
  console.log(`   ${categoriesWithoutSchool.length} kategori atandı`);

  // 5. Tüm kitapları varsayılan okula ata
  console.log('5. Kitaplar varsayılan okula atanıyor...');
  const booksWithoutSchool = await prisma.book.findMany({
    where: { schoolId: null as any },
  });

  for (const book of booksWithoutSchool) {
    await prisma.book.update({
      where: { id: book.id },
      data: { schoolId: defaultSchool.id },
    });
  }
  console.log(`   ${booksWithoutSchool.length} kitap atandı`);

  // 6. Tüm ödünçleri varsayılan okula ata
  console.log('6. Ödünçler varsayılan okula atanıyor...');
  const loansWithoutSchool = await prisma.loan.findMany({
    where: { schoolId: null as any },
  });

  for (const loan of loansWithoutSchool) {
    await prisma.loan.update({
      where: { id: loan.id },
      data: { schoolId: defaultSchool.id },
    });
  }
  console.log(`   ${loansWithoutSchool.length} ödünç atandı`);

  console.log('\nMigrasyon tamamlandı!');
  console.log(`Varsayılan Okul ID: ${defaultSchool.id}`);
}

main()
  .catch((e) => {
    console.error('Migrasyon hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
