-- CreateEnum - Add DEVELOPER to Role
ALTER TYPE "Role" ADD VALUE 'DEVELOPER';

-- CreateTable School
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- Insert default school
INSERT INTO "School" ("id", "name", "slug", "email", "isActive", "createdAt", "updatedAt")
VALUES ('default-school-id', 'Varsayılan Okul', 'varsayilan-okul', 'info@varsayilanokul.edu.tr', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add isMainAdmin to User (nullable first)
ALTER TABLE "User" ADD COLUMN "isMainAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Add schoolId to User (nullable)
ALTER TABLE "User" ADD COLUMN "schoolId" TEXT;

-- Update all users to default school
UPDATE "User" SET "schoolId" = 'default-school-id';

-- Add schoolId to Category (nullable first)
ALTER TABLE "Category" ADD COLUMN "schoolId" TEXT;

-- Update all categories to default school
UPDATE "Category" SET "schoolId" = 'default-school-id';

-- Make schoolId required on Category
ALTER TABLE "Category" ALTER COLUMN "schoolId" SET NOT NULL;

-- Remove unique constraint on slug for Category
DROP INDEX IF EXISTS "Category_slug_key";

-- Add composite unique constraint
CREATE UNIQUE INDEX "Category_schoolId_slug_key" ON "Category"("schoolId", "slug");

-- Add schoolId to Book (nullable first)
ALTER TABLE "Book" ADD COLUMN "schoolId" TEXT;

-- Update all books to default school
UPDATE "Book" SET "schoolId" = 'default-school-id';

-- Make schoolId required on Book
ALTER TABLE "Book" ALTER COLUMN "schoolId" SET NOT NULL;

-- Add schoolId to Loan (nullable first)
ALTER TABLE "Loan" ADD COLUMN "schoolId" TEXT;

-- Update all loans to default school
UPDATE "Loan" SET "schoolId" = 'default-school-id';

-- Make schoolId required on Loan
ALTER TABLE "Loan" ALTER COLUMN "schoolId" SET NOT NULL;

-- Add foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Book" ADD CONSTRAINT "Book_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Set first admin as main admin
UPDATE "User" SET "isMainAdmin" = true
WHERE "id" = (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1);
