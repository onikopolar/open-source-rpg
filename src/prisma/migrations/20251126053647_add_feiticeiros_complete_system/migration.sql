-- AlterTable
ALTER TABLE "character" ADD COLUMN     "atencao_bonus" INTEGER DEFAULT 0,
ADD COLUMN     "atencao_calculado" INTEGER DEFAULT 10,
ADD COLUMN     "current_energy_points" INTEGER DEFAULT 0,
ADD COLUMN     "current_soul_integrity" INTEGER DEFAULT 0,
ADD COLUMN     "defesa_bonus" INTEGER DEFAULT 0,
ADD COLUMN     "defesa_calculada" INTEGER DEFAULT 10,
ADD COLUMN     "derived_values_bonuses" TEXT DEFAULT '{}',
ADD COLUMN     "deslocamento_bonus" INTEGER DEFAULT 0,
ADD COLUMN     "deslocamento_calculado" INTEGER DEFAULT 9,
ADD COLUMN     "especializacao" TEXT,
ADD COLUMN     "experiencia" INTEGER DEFAULT 0,
ADD COLUMN     "grau" TEXT,
ADD COLUMN     "iniciativa_bonus" INTEGER DEFAULT 0,
ADD COLUMN     "iniciativa_calculada" INTEGER DEFAULT 0,
ADD COLUMN     "level" INTEGER DEFAULT 1,
ADD COLUMN     "max_energy_points" INTEGER DEFAULT 0,
ADD COLUMN     "multiclasse" TEXT,
ADD COLUMN     "origem" TEXT,
ADD COLUMN     "tecnica" TEXT,
ADD COLUMN     "treino" TEXT;

-- CreateTable
CREATE TABLE "feiticeiros_attribute" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_value" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "feiticeiros_attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feiticeiros_character_attributes" (
    "character_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "feiticeiros_character_attributes_pkey" PRIMARY KEY ("character_id","attribute_id")
);

-- CreateTable
CREATE TABLE "feiticeiros_pericias" (
    "id" SERIAL NOT NULL,
    "character_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "atributo" TEXT NOT NULL,
    "descricao" TEXT,
    "treinada" BOOLEAN NOT NULL DEFAULT false,
    "mestre" BOOLEAN NOT NULL DEFAULT false,
    "outros" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "feiticeiros_pericias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feiticeiros_oficios" (
    "id" SERIAL NOT NULL,
    "character_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "atributo" TEXT NOT NULL,
    "descricao" TEXT,
    "treinada" BOOLEAN NOT NULL DEFAULT false,
    "mestre" BOOLEAN NOT NULL DEFAULT false,
    "outros" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "feiticeiros_oficios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feiticeiros_resistencias" (
    "id" SERIAL NOT NULL,
    "character_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "atributo" TEXT NOT NULL,
    "descricao" TEXT,
    "treinada" BOOLEAN NOT NULL DEFAULT false,
    "mestre" BOOLEAN NOT NULL DEFAULT false,
    "outros" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "feiticeiros_resistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feiticeiros_ataques" (
    "id" SERIAL NOT NULL,
    "character_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "atributo" TEXT NOT NULL,
    "descricao" TEXT,
    "treinada" BOOLEAN NOT NULL DEFAULT false,
    "mestre" BOOLEAN NOT NULL DEFAULT false,
    "outros" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "feiticeiros_ataques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feiticeiros_attribute_name_key" ON "feiticeiros_attribute"("name");

-- CreateIndex
CREATE INDEX "feiticeiros_attribute_name_idx" ON "feiticeiros_attribute"("name");

-- CreateIndex
CREATE INDEX "feiticeiros_pericias_character_id_idx" ON "feiticeiros_pericias"("character_id");

-- CreateIndex
CREATE INDEX "feiticeiros_oficios_character_id_idx" ON "feiticeiros_oficios"("character_id");

-- CreateIndex
CREATE INDEX "feiticeiros_resistencias_character_id_idx" ON "feiticeiros_resistencias"("character_id");

-- CreateIndex
CREATE INDEX "feiticeiros_ataques_character_id_idx" ON "feiticeiros_ataques"("character_id");

-- AddForeignKey
ALTER TABLE "feiticeiros_character_attributes" ADD CONSTRAINT "feiticeiros_character_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "feiticeiros_attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feiticeiros_character_attributes" ADD CONSTRAINT "feiticeiros_character_attributes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feiticeiros_pericias" ADD CONSTRAINT "feiticeiros_pericias_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feiticeiros_oficios" ADD CONSTRAINT "feiticeiros_oficios_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feiticeiros_resistencias" ADD CONSTRAINT "feiticeiros_resistencias_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feiticeiros_ataques" ADD CONSTRAINT "feiticeiros_ataques_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
