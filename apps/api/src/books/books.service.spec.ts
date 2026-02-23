import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BooksService } from './books.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  book: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('BooksService', () => {
  let service: BooksService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return books for a school', async () => {
      const mockBooks = [
        { id: '1', title: 'Test Book', author: 'Author', schoolId: 'school-1', category: null },
      ];
      prisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await service.findAll('school-1');
      expect(result).toEqual(mockBooks);
      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: { schoolId: 'school-1' },
        include: { category: true },
        orderBy: { title: 'asc' },
      });
    });

    it('should filter by categoryId when provided', async () => {
      prisma.book.findMany.mockResolvedValue([]);

      await service.findAll('school-1', 'cat-1');
      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: { schoolId: 'school-1', categoryId: 'cat-1' },
        include: { category: true },
        orderBy: { title: 'asc' },
      });
    });
  });

  describe('findPublic', () => {
    it('should return public books from active schools', async () => {
      const mockBooks = [{ id: '1', title: 'Public Book' }];
      prisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await service.findPublic();
      expect(result).toEqual(mockBooks);
      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: { school: { isActive: true } },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a book by id', async () => {
      const mockBook = { id: '1', title: 'Test', schoolId: 'school-1', category: null };
      prisma.book.findUnique.mockResolvedValue(mockBook);

      const result = await service.findOne('1', 'school-1');
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException when book not found', async () => {
      prisma.book.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'school-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when book belongs to another school', async () => {
      const mockBook = { id: '1', title: 'Test', schoolId: 'school-2', category: null };
      prisma.book.findUnique.mockResolvedValue(mockBook);

      await expect(service.findOne('1', 'school-1')).rejects.toThrow(NotFoundException);
    });
  });
});
