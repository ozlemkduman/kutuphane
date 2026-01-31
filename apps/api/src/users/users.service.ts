// UsersService - Kullanıcı işlemleri

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Yeni kullanıcı oluştur - öğrenci bilgileri ile
  async create(data: {
    firebaseUid: string;
    email: string;
    name: string;
    schoolId: string;
    className: string;
    section: string;
    studentNumber: string;
  }) {
    return this.prisma.user.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        name: data.name,
        role: 'MEMBER',
        status: 'PENDING', // Okul admini onaylayacak
        schoolId: data.schoolId,
        className: data.className,
        section: data.section,
        studentNumber: data.studentNumber,
      },
      include: { school: true },
    });
  }

  // Firebase UID ile kullanıcı bul
  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { school: true },
    });
  }
}
