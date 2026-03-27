-- CreateTable
CREATE TABLE "tabletop_tokens" (
    "id" TEXT NOT NULL,
    "characterId" INTEGER,
    "tokenId" TEXT NOT NULL,
    "nome" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "escala" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "larguraOriginal" INTEGER NOT NULL DEFAULT 50,
    "alturaOriginal" INTEGER NOT NULL DEFAULT 50,
    "invertido" BOOLEAN NOT NULL DEFAULT false,
    "oculto" BOOLEAN NOT NULL DEFAULT false,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "imageBase64" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabletop_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tabletop_nevoa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Camada de Névoa',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "escala" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "larguraOriginal" INTEGER NOT NULL DEFAULT 500,
    "alturaOriginal" INTEGER NOT NULL DEFAULT 500,
    "imageData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabletop_nevoa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tabletop_tokens_characterId_idx" ON "tabletop_tokens"("characterId");

-- CreateIndex
CREATE INDEX "tabletop_tokens_tokenId_idx" ON "tabletop_tokens"("tokenId");

-- CreateIndex
CREATE INDEX "tabletop_tokens_x_y_idx" ON "tabletop_tokens"("x", "y");

-- CreateIndex
CREATE INDEX "tabletop_nevoa_x_y_idx" ON "tabletop_nevoa"("x", "y");

-- AddForeignKey
ALTER TABLE "tabletop_tokens" ADD CONSTRAINT "tabletop_tokens_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
