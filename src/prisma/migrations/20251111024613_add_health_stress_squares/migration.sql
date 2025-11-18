-- AlterTable
ALTER TABLE "character" ADD COLUMN "health_squares" TEXT DEFAULT '[]';
ALTER TABLE "character" ADD COLUMN "stress_squares" TEXT DEFAULT '[]';

-- CreateTable
CREATE TABLE "yearzero_attributes" (
    "character_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("character_id", "attribute_id"),
    CONSTRAINT "yearzero_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "yearzero_attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "yearzero_attributes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "yearzero_attribute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "yearzero_skills" (
    "character_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("character_id", "skill_id"),
    CONSTRAINT "yearzero_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "yearzero_skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "yearzero_skills_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "yearzero_skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "yearzero_attribute_name_key" ON "yearzero_attribute"("name");

-- CreateIndex
CREATE INDEX "yearzero_attribute_name_idx" ON "yearzero_attribute"("name");

-- CreateIndex
CREATE UNIQUE INDEX "yearzero_skill_name_key" ON "yearzero_skill"("name");

-- CreateIndex
CREATE INDEX "yearzero_skill_name_idx" ON "yearzero_skill"("name");
