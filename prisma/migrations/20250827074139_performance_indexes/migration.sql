-- DropIndex
DROP INDEX "Assignment_targetType_targetId_idx";

-- DropIndex
DROP INDEX "Assignment_userId_idx";

-- CreateIndex
CREATE INDEX "Assignment_targetType_targetId_status_idx" ON "Assignment"("targetType", "targetId", "status");

-- CreateIndex
CREATE INDEX "Assignment_userId_status_idx" ON "Assignment"("userId", "status");

-- CreateIndex
CREATE INDEX "Assignment_assignedBy_assignedAt_idx" ON "Assignment"("assignedBy", "assignedAt");

-- CreateIndex
CREATE INDEX "Task_userId_createdAt_idx" ON "Task"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_userId_completed_idx" ON "Task"("userId", "completed");

-- CreateIndex
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_projectId_completed_idx" ON "Task"("projectId", "completed");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");
