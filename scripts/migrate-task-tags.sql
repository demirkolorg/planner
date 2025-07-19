-- Migration script to move existing task-tag relationships to junction table

-- First, create TaskTag and Reminder tables if they don't exist
CREATE TABLE IF NOT EXISTS "TaskTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "TaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reminder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add unique constraint on TaskTag
CREATE UNIQUE INDEX IF NOT EXISTS "TaskTag_taskId_tagId_key" ON "TaskTag"("taskId", "tagId");

-- Migrate existing task-tag relationships
INSERT INTO "TaskTag" ("id", "taskId", "tagId")
SELECT 
    'cuid_' || random()::text || '_' || extract(epoch from now())::text,
    t."id",
    t."tagId"
FROM "Task" t
WHERE t."tagId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add dueDate column to Task table
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);