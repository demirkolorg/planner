-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "assignedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "message" TEXT,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assignment_targetType_targetId_idx" ON "Assignment"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Assignment_userId_idx" ON "Assignment"("userId");

-- CreateIndex
CREATE INDEX "Assignment_email_status_idx" ON "Assignment"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_targetType_targetId_userId_key" ON "Assignment"("targetType", "targetId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_targetType_targetId_email_key" ON "Assignment"("targetType", "targetId", "email");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
