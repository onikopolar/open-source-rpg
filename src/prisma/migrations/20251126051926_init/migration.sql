-- CreateTable
CREATE TABLE "character" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "player_name" TEXT,
    "rpg_system" TEXT NOT NULL DEFAULT 'classic',
    "current_hit_points" INTEGER NOT NULL DEFAULT 0,
    "max_hit_points" INTEGER NOT NULL DEFAULT 0,
    "current_picture" INTEGER NOT NULL DEFAULT 1,
    "is_dead" BOOLEAN NOT NULL DEFAULT false,
    "standard_character_picture_url" TEXT,
    "injured_character_picture_url" TEXT,
    "stress_level" INTEGER DEFAULT 0,
    "trauma_level" INTEGER DEFAULT 0,
    "willpower" INTEGER DEFAULT 0,
    "experience" INTEGER DEFAULT 0,
    "health_squares" TEXT DEFAULT '[]',
    "stress_squares" TEXT DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_attributes" (
    "character_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "character_attributes_pkey" PRIMARY KEY ("character_id","attribute_id")
);

-- CreateTable
CREATE TABLE "attribute" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_skills" (
    "character_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "character_skills_pkey" PRIMARY KEY ("character_id","skill_id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yearzero_attributes" (
    "character_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "yearzero_attributes_pkey" PRIMARY KEY ("character_id","attribute_id")
);

-- CreateTable
CREATE TABLE "yearzero_attribute" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "yearzero_attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yearzero_skills" (
    "character_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "yearzero_skills_pkey" PRIMARY KEY ("character_id","skill_id")
);

-- CreateTable
CREATE TABLE "yearzero_skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "yearzero_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roll" (
    "id" SERIAL NOT NULL,
    "max_number" INTEGER NOT NULL,
    "rolled_number" INTEGER NOT NULL,
    "character_id" INTEGER NOT NULL,
    "rolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "character_name_idx" ON "character"("name");

-- CreateIndex
CREATE INDEX "character_player_name_idx" ON "character"("player_name");

-- CreateIndex
CREATE INDEX "character_rpg_system_idx" ON "character"("rpg_system");

-- CreateIndex
CREATE INDEX "character_created_at_idx" ON "character"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_name_key" ON "attribute"("name");

-- CreateIndex
CREATE INDEX "attribute_name_idx" ON "attribute"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "yearzero_attribute_name_key" ON "yearzero_attribute"("name");

-- CreateIndex
CREATE INDEX "yearzero_attribute_name_idx" ON "yearzero_attribute"("name");

-- CreateIndex
CREATE UNIQUE INDEX "yearzero_skill_name_key" ON "yearzero_skill"("name");

-- CreateIndex
CREATE INDEX "yearzero_skill_name_idx" ON "yearzero_skill"("name");

-- CreateIndex
CREATE INDEX "roll_character_id_idx" ON "roll"("character_id");

-- CreateIndex
CREATE INDEX "roll_rolled_at_idx" ON "roll"("rolled_at");

-- CreateIndex
CREATE UNIQUE INDEX "config_name_key" ON "config"("name");

-- CreateIndex
CREATE INDEX "config_name_idx" ON "config"("name");

-- AddForeignKey
ALTER TABLE "character_attributes" ADD CONSTRAINT "character_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_attributes" ADD CONSTRAINT "character_attributes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yearzero_attributes" ADD CONSTRAINT "yearzero_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "yearzero_attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yearzero_attributes" ADD CONSTRAINT "yearzero_attributes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yearzero_skills" ADD CONSTRAINT "yearzero_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "yearzero_skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yearzero_skills" ADD CONSTRAINT "yearzero_skills_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roll" ADD CONSTRAINT "roll_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
