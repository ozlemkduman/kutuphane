-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PASSIVE';

-- AlterTable: Make firebaseUid and email nullable for passive students
ALTER TABLE "User" ALTER COLUMN "firebaseUid" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable: Add createdById to User (who created the passive student)
ALTER TABLE "User" ADD COLUMN "createdById" TEXT;

-- AlterTable: Add lentById to Loan (who lent on behalf)
ALTER TABLE "Loan" ADD COLUMN "lentById" TEXT;
