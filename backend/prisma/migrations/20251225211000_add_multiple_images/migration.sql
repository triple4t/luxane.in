-- AlterTable: Convert image from String to String[] (array)
-- First, add a new column for the array
ALTER TABLE "Product" ADD COLUMN "images" TEXT[];

-- Migrate existing image data to array format
UPDATE "Product" SET "images" = ARRAY["image"] WHERE "image" IS NOT NULL AND "image" != '';

-- Set default empty array for products without images
UPDATE "Product" SET "images" = ARRAY[]::TEXT[] WHERE "images" IS NULL;

-- Drop the old image column
ALTER TABLE "Product" DROP COLUMN "image";

-- Rename images column to image (to match schema)
ALTER TABLE "Product" RENAME COLUMN "images" TO "image";

