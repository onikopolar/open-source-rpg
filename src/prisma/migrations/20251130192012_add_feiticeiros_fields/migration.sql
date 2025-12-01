-- AlterTable
ALTER TABLE "character" ADD COLUMN     "feiticeiros_distribution_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feiticeiros_metodo_criacao" TEXT DEFAULT 'FIXOS';
