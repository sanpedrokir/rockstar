-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "game_name" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_rooms" (
    "id" SERIAL NOT NULL,
    "room_code" TEXT NOT NULL,
    "host_account_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "total_rounds" INTEGER NOT NULL DEFAULT 8,
    "current_round" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_players" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "round_number" INTEGER NOT NULL,
    "song_title" TEXT NOT NULL,
    "song_artist" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guesses" (
    "id" SERIAL NOT NULL,
    "round_id" INTEGER NOT NULL,
    "room_player_id" INTEGER NOT NULL,
    "guessed_title" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_game_name_key" ON "accounts"("game_name");

-- CreateIndex
CREATE UNIQUE INDEX "game_rooms_room_code_key" ON "game_rooms"("room_code");

-- CreateIndex
CREATE UNIQUE INDEX "room_players_room_id_account_id_key" ON "room_players"("room_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_room_id_round_number_key" ON "rounds"("room_id", "round_number");

-- CreateIndex
CREATE UNIQUE INDEX "guesses_round_id_room_player_id_key" ON "guesses"("round_id", "room_player_id");

-- AddForeignKey
ALTER TABLE "game_rooms" ADD CONSTRAINT "game_rooms_host_account_id_fkey" FOREIGN KEY ("host_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "game_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "game_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guesses" ADD CONSTRAINT "guesses_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guesses" ADD CONSTRAINT "guesses_room_player_id_fkey" FOREIGN KEY ("room_player_id") REFERENCES "room_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
