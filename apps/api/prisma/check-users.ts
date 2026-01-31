import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      schoolId: true,
      isMainAdmin: true,
    },
  });

  console.log('Kullanıcılar:');
  console.table(users);

  const schools = await prisma.school.findMany();
  console.log('\nOkullar:');
  console.table(schools);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
