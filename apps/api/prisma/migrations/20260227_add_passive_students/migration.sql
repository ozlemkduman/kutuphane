-- AlterEnum: Add PASSIVE to UserStatus (idempotent)
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'PASSIVE';

-- AlterTable: Make firebaseUid nullable
ALTER TABLE "User" ALTER COLUMN "firebaseUid" DROP NOT NULL;

-- AlterTable: Make email nullable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable: Add createdById to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

-- AlterTable: Add lentById to Loan
ALTER TABLE "Loan" ADD COLUMN IF NOT EXISTS "lentById" TEXT;
