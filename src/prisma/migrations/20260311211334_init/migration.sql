-- AlterTable
ALTER TABLE "character" ADD COLUMN     "armadura" TEXT,
ADD COLUMN     "armas" TEXT DEFAULT '[]',
ADD COLUMN     "carga_armadura" TEXT DEFAULT '',
ADD COLUMN     "conditions" TEXT DEFAULT '{}',
ADD COLUMN     "consumables" TEXT DEFAULT '{}',
ADD COLUMN     "emotional_item" TEXT,
ADD COLUMN     "injured_character_image" TEXT,
ADD COLUMN     "injured_image_mime" TEXT,
ADD COLUMN     "injuries" TEXT DEFAULT '[]',
ADD COLUMN     "nivel_armadura" TEXT DEFAULT '',
ADD COLUMN     "standard_character_image" TEXT,
ADD COLUMN     "standard_image_mime" TEXT,
ADD COLUMN     "tiny_items" TEXT;
