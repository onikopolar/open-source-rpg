-- AlterTable
ALTER TABLE "tabletop_tokens" ADD COLUMN     "parent_id" TEXT;

-- CreateIndex
CREATE INDEX "tabletop_tokens_parent_id_idx" ON "tabletop_tokens"("parent_id");

-- AddForeignKey
ALTER TABLE "tabletop_tokens" ADD CONSTRAINT "tabletop_tokens_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tabletop_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
