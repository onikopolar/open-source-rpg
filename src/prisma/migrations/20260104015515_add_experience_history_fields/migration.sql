-- AlterTable
ALTER TABLE "character" ADD COLUMN     "experience_points" INTEGER DEFAULT 0,
ADD COLUMN     "experience_squares" TEXT DEFAULT '[]',
ADD COLUMN     "history_points" INTEGER DEFAULT 0,
ADD COLUMN     "history_squares" TEXT DEFAULT '[]';
