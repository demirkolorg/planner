-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('PROJECT', 'CALENDAR', 'QUICK_NOTE');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "calendarSourceId" TEXT,
ADD COLUMN     "quickNoteCategory" TEXT,
ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'PROJECT',
ALTER COLUMN "projectId" DROP NOT NULL;
