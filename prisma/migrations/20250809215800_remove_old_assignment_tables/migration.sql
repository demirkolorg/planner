-- Remove old assignment tables after successful migration to unified Assignment table
-- All data has already been migrated to Assignment table

-- Drop old assignment tables
DROP TABLE "TaskAssignment";
DROP TABLE "SectionAssignment"; 
DROP TABLE "ProjectAssignment";
DROP TABLE "EmailAssignment";

-- Drop unused enums
DROP TYPE "SectionRole";
DROP TYPE "ProjectAssignmentRole";
DROP TYPE "AssignmentTargetType";
DROP TYPE "AssignmentStatus";