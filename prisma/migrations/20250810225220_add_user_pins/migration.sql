-- CreateTable
CREATE TABLE "UserPin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPin_userId_targetType_idx" ON "UserPin"("userId", "targetType");

-- CreateIndex
CREATE UNIQUE INDEX "UserPin_userId_targetType_targetId_key" ON "UserPin"("userId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "UserPin" ADD CONSTRAINT "UserPin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
