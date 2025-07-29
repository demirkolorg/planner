-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "syncToCalendar" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GoogleCalendarIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCalendarEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarIntegration_userId_key" ON "GoogleCalendarIntegration"("userId");

-- CreateIndex
CREATE INDEX "GoogleCalendarIntegration_userId_idx" ON "GoogleCalendarIntegration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCalendarEvent_taskId_key" ON "TaskCalendarEvent"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCalendarEvent_googleEventId_key" ON "TaskCalendarEvent"("googleEventId");

-- CreateIndex
CREATE INDEX "TaskCalendarEvent_taskId_idx" ON "TaskCalendarEvent"("taskId");

-- CreateIndex
CREATE INDEX "TaskCalendarEvent_googleEventId_idx" ON "TaskCalendarEvent"("googleEventId");

-- AddForeignKey
ALTER TABLE "GoogleCalendarIntegration" ADD CONSTRAINT "GoogleCalendarIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCalendarEvent" ADD CONSTRAINT "TaskCalendarEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
