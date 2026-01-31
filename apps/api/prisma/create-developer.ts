// Developer kullanıcı oluştur
// Firebase'den UID alıp database'e DEVELOPER olarak ekler

import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as path from 'path';

const prisma = new PrismaClient();

// Firebase Admin başlat
if (!admin.apps.length) {
  const serviceAccountPath = path.join(process.cwd(), 'firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('Kullanım: npx ts-node prisma/create-developer.ts email@example.com');
    process.exit(1);
  }

  // Firebase'den kullanıcıyı bul
  let firebaseUser;
  try {
    firebaseUser = await admin.auth().getUserByEmail(email);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`❌ Firebase'de kullanıcı bulunamadı: ${email}`);
      process.exit(1);
    }
    throw error;
  }

  console.log(`✅ Firebase kullanıcısı bulundu: ${firebaseUser.uid}`);

  // Database'de zaten var mı kontrol et
  const existingUser = await prisma.user.findUnique({
    where: { firebaseUid: firebaseUser.uid },
  });

  if (existingUser) {
    // Varsa DEVELOPER yap
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: 'DEVELOPER', schoolId: null, status: 'APPROVED' },
    });
    console.log(`✅ Mevcut kullanıcı DEVELOPER yapıldı: ${updated.name} (${updated.email})`);
  } else {
    // Yoksa yeni oluştur
    const newUser = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || email.split('@')[0],
        role: 'DEVELOPER',
        status: 'APPROVED',
        schoolId: null,
      },
    });
    console.log(`✅ Yeni DEVELOPER oluşturuldu: ${newUser.name} (${newUser.email})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
