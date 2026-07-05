/*
  Warnings:

  - You are about to drop the column `guessed_title` on the `guesses` table. All the data in the column will be lost.
  - You are about to drop the column `song_artist` on the `rounds` table. All the data in the column will be lost.
  - You are about to drop the column `song_title` on the `rounds` table. All the data in the column will be lost.
  - Added the required column `guessed_song_id` to the `guesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `song_id` to the `rounds` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "guesses" DROP COLUMN "guessed_title",
ADD COLUMN     "guessed_song_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "rounds" DROP COLUMN "song_artist",
DROP COLUMN "song_title",
ADD COLUMN     "option_ids" INTEGER[],
ADD COLUMN     "song_id" INTEGER NOT NULL;
