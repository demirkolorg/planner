-- CreateEnum
CREATE TYPE "AssignmentTargetType" AS ENUM ('PROJECT', 'SECTION', 'TASK');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "EmailAssignment" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "targetType" "AssignmentTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "expiresAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "EmailAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingUserInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "inviteType" TEXT NOT NULL,
    "projectId" TEXT,
    "projectName" TEXT,
    "metadata" JSONB,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "PendingUserInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailAssignment_email_status_idx" ON "EmailAssignment"("email", "status");

-- CreateIndex
CREATE INDEX "EmailAssignment_targetType_targetId_idx" ON "EmailAssignment"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "EmailAssignment_assignedBy_idx" ON "EmailAssignment"("assignedBy");

-- CreateIndex
CREATE INDEX "PendingUserInvitation_email_status_idx" ON "PendingUserInvitation"("email", "status");

-- CreateIndex
CREATE INDEX "PendingUserInvitation_invitedBy_idx" ON "PendingUserInvitation"("invitedBy");

-- CreateIndex
CREATE INDEX "PendingUserInvitation_projectId_idx" ON "PendingUserInvitation"("projectId");

-- AddForeignKey
ALTER TABLE "EmailAssignment" ADD CONSTRAINT "EmailAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingUserInvitation" ADD CONSTRAINT "PendingUserInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingUserInvitation" ADD CONSTRAINT "PendingUserInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
