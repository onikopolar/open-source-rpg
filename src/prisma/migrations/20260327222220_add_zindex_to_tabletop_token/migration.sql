-- AlterTable
ALTER TABLE "tabletop_tokens" ADD COLUMN     "zIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "tabletop_tokens_zIndex_idx" ON "tabletop_tokens"("zIndex");
