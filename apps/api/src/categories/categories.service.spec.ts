import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return categories for a school', async () => {
      const mockCategories = [
        { id: '1', name: 'Roman', slug: 'roman', schoolId: 'school-1' },
      ];
      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll('school-1');
      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { schoolId: 'school-1' },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const mockCategory = { id: '1', name: 'Roman', schoolId: 'school-1', books: [] };
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne('1', 'school-1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'school-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when category belongs to another school', async () => {
      const mockCategory = { id: '1', name: 'Roman', schoolId: 'school-2', books: [] };
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.findOne('1', 'school-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      const mockCategory = { id: '1', name: 'Roman', slug: 'roman', schoolId: 'school-1', books: [] };
      prisma.category.findFirst.mockResolvedValue(mockCategory);

      const result = await service.findBySlug('roman', 'school-1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException for invalid slug', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('invalid', 'school-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      const newCategory = { id: '1', name: 'Roman', slug: 'roman', icon: '📖', color: '#6366f1', schoolId: 'school-1' };
      prisma.category.create.mockResolvedValue(newCategory);

      const result = await service.create('school-1', { slug: 'roman', name: 'Roman', icon: '📖', color: '#6366f1' });
      expect(result).toEqual(newCategory);
    });

    it('should throw BadRequestException for duplicate slug', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: '1', slug: 'roman' });

      await expect(
        service.create('school-1', { slug: 'roman', name: 'Roman', icon: '📖', color: '#6366f1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
