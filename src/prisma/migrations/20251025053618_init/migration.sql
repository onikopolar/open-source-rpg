-- CreateTable
CREATE TABLE "character" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "character_attributes" (
    "character_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    PRIMARY KEY ("character_id", "attribute_id"),
    CONSTRAINT "character_attributes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "character_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attribute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "character_skills" (
    "character_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    PRIMARY KEY ("character_id", "skill_id"),
    CONSTRAINT "character_skills_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "character_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skills" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "roll" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "max_number" INTEGER NOT NULL,
    "rolled_number" INTEGER NOT NULL,
    "character_id" INTEGER NOT NULL,
    "rolled_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roll_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "value" TEXT
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
CREATE INDEX "roll_character_id_idx" ON "roll"("character_id");

-- CreateIndex
CREATE INDEX "roll_rolled_at_idx" ON "roll"("rolled_at");

-- CreateIndex
CREATE UNIQUE INDEX "config_name_key" ON "config"("name");

-- CreateIndex
CREATE INDEX "config_name_idx" ON "config"("name");
