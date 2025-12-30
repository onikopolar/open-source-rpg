-- AlterTable
ALTER TABLE "character" ADD COLUMN     "equipment_notes" TEXT;

-- AlterTable
ALTER TABLE "yearzero_attributes" ALTER COLUMN "value" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "yearzero_skills" ALTER COLUMN "value" SET DEFAULT 0;
