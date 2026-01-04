-- AlterTable
ALTER TABLE "character" ADD COLUMN     "appearance" TEXT,
ADD COLUMN     "camarada" TEXT,
ADD COLUMN     "career" TEXT,
ADD COLUMN     "personal_goal" TEXT,
ADD COLUMN     "rival" TEXT,
ADD COLUMN     "talents" TEXT DEFAULT '[]';
