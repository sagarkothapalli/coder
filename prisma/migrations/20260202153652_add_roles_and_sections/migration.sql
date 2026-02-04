/*
  Warnings:

  - A unique constraint covering the columns `[rollNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "rollNumber" INTEGER,
ADD COLUMN     "section" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_rollNumber_key" ON "User"("rollNumber");
