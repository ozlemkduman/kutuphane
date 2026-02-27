-- AlterEnum: Add PASSIVE to UserStatus
ALTER TYPE "UserStatus" ADD VALUE 'PASSIVE';

-- AlterTable: Make firebaseUid nullable
ALTER TABLE "User" ALTER COLUMN "firebaseUid" DROP NOT NULL;

-- AlterTable: Make email nullable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable: Add createdById to User
ALTER TABLE "User" ADD COLUMN "createdById" TEXT;

-- AlterTable: Add lentById to Loan
ALTER TABLE "Loan" ADD COLUMN "lentById" TEXT;
