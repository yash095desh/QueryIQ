/*
  Warnings:

  - You are about to drop the column `attachments` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `toolCallArgs` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `toolCallId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `toolCallName` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `toolResult` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `toolResultId` on the `Message` table. All the data in the column will be lost.
  - Added the required column `parts` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "attachments",
DROP COLUMN "toolCallArgs",
DROP COLUMN "toolCallId",
DROP COLUMN "toolCallName",
DROP COLUMN "toolResult",
DROP COLUMN "toolResultId",
ADD COLUMN     "parts" JSONB NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;
