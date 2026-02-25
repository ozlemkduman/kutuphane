// UsersService - Kullanıcı işlemleri

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Yeni kullanıcı oluştur
  async create(data: {
    firebaseUid: string;
    email: string;
    name: string;
    schoolId: string;
    role: 'MEMBER' | 'TEACHER';
    className: string | null;
    section: string | null;
    studentNumber: string | null;
  }) {
    return this.prisma.user.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        name: data.name,
        role: data.role,
        status: 'PENDING',
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
