-- CreateTable
CREATE TABLE "ProjectCustomField" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectCustomField_projectId_idx" ON "ProjectCustomField"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCustomField_projectId_key_key" ON "ProjectCustomField"("projectId", "key");

-- AddForeignKey
ALTER TABLE "ProjectCustomField" ADD CONSTRAINT "ProjectCustomField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
