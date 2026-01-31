// Kullanıcıyı DEVELOPER rolüne yükselt
// Kullanım: npx ts-node prisma/set-developer.ts senin@email.com

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('Kullanım: npx ts-node prisma/set-developer.ts email@example.com');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`Kullanıcı bulunamadı: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'DEVELOPER', schoolId: null },
  });

  console.log(`✅ ${updated.name} (${updated.email}) artık DEVELOPER!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
