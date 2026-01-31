// FirebaseService - Token doğrulama işlemlerini yapar

import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    // Firebase Admin SDK'yı başlat
    if (!admin.apps.length) {
      const serviceAccountPath = path.join(
        process.cwd(),
        'firebase-admin-key.json',
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });

      console.log('Firebase Admin başlatıldı');
    }
  }

  // Token'ı doğrula
  async verifyToken(token: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      return null;
    }
  }

  // Firebase kullanıcısını sil (UID ile)
  async deleteUser(uid: string): Promise<boolean> {
    try {
      await admin.auth().deleteUser(uid);
      console.log(`Firebase kullanıcısı silindi: ${uid}`);
      return true;
    } catch (error) {
      console.error(`Firebase kullanıcısı silinemedi: ${uid}`, error);
      return false;
    }
  }

  // E-posta ile Firebase kullanıcısını bul
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
    try {
      const user = await admin.auth().getUserByEmail(email);
      return user;
    } catch (error: any) {
      // Kullanıcı bulunamadıysa null dön
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      console.error(`Firebase kullanıcısı bulunamadı: ${email}`, error);
      return null;
    }
  }

  // E-posta ile Firebase kullanıcısını sil
  async deleteUserByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (user) {
        await admin.auth().deleteUser(user.uid);
        console.log(`Firebase kullanıcısı silindi (e-posta ile): ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Firebase kullanıcısı silinemedi (e-posta ile): ${email}`, error);
      return false;
    }
  }
}
