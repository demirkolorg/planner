/*
  Warnings:

  - You are about to drop the `InAppNotification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reminder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InAppNotification" DROP CONSTRAINT "InAppNotification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_taskId_fkey";

-- DropTable
DROP TABLE "InAppNotification";

-- DropTable
DROP TABLE "Reminder";
