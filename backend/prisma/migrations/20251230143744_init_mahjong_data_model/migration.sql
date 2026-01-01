-- CreateEnum
CREATE TYPE "HanchanStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Wind" AS ENUM ('EAST', 'SOUTH', 'WEST', 'NORTH');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RoundResultType" AS ENUM ('TSUMO', 'RON', 'DRAW', 'NAGASHI_MANGAN', 'SPECIAL_DRAW');

-- CreateEnum
CREATE TYPE "SpecialDrawType" AS ENUM ('FOUR_KAN', 'FOUR_WIND', 'NINE_TERMINALS');

-- CreateEnum
CREATE TYPE "NakiType" AS ENUM ('PON', 'CHI', 'DAIMINKAN', 'ANKAN');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hanchan" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" "HanchanStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hanchan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HanchanPlayer" (
    "id" TEXT NOT NULL,
    "hanchanId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seatPosition" INTEGER NOT NULL,
    "initialScore" INTEGER NOT NULL DEFAULT 25000,
    "finalScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HanchanPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "hanchanId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "wind" "Wind" NOT NULL,
    "dealerPlayerId" TEXT NOT NULL,
    "honba" INTEGER NOT NULL DEFAULT 0,
    "riichiSticks" INTEGER NOT NULL DEFAULT 0,
    "isRenchan" BOOLEAN NOT NULL DEFAULT false,
    "status" "RoundStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "resultType" "RoundResultType",
    "specialDrawType" "SpecialDrawType",
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "scoreChange" INTEGER NOT NULL,
    "isDealer" BOOLEAN NOT NULL,
    "isWinner" BOOLEAN NOT NULL,
    "isRonTarget" BOOLEAN,
    "han" INTEGER,
    "fu" INTEGER,
    "yaku" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Naki" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" "NakiType" NOT NULL,
    "targetPlayerId" TEXT,
    "tiles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Naki_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Riichi" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isDoubleRiichi" BOOLEAN NOT NULL DEFAULT false,
    "isIppatsu" BOOLEAN NOT NULL DEFAULT false,
    "declaredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Riichi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");

-- CreateIndex
CREATE INDEX "HanchanPlayer_hanchanId_idx" ON "HanchanPlayer"("hanchanId");

-- CreateIndex
CREATE INDEX "HanchanPlayer_playerId_idx" ON "HanchanPlayer"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "HanchanPlayer_hanchanId_playerId_key" ON "HanchanPlayer"("hanchanId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "HanchanPlayer_hanchanId_seatPosition_key" ON "HanchanPlayer"("hanchanId", "seatPosition");

-- CreateIndex
CREATE INDEX "Round_hanchanId_idx" ON "Round"("hanchanId");

-- CreateIndex
CREATE INDEX "Round_dealerPlayerId_idx" ON "Round"("dealerPlayerId");

-- CreateIndex
CREATE INDEX "Score_roundId_idx" ON "Score"("roundId");

-- CreateIndex
CREATE INDEX "Score_playerId_idx" ON "Score"("playerId");

-- CreateIndex
CREATE INDEX "Naki_roundId_idx" ON "Naki"("roundId");

-- CreateIndex
CREATE INDEX "Naki_playerId_idx" ON "Naki"("playerId");

-- CreateIndex
CREATE INDEX "Riichi_roundId_idx" ON "Riichi"("roundId");

-- CreateIndex
CREATE INDEX "Riichi_playerId_idx" ON "Riichi"("playerId");

-- AddForeignKey
ALTER TABLE "HanchanPlayer" ADD CONSTRAINT "HanchanPlayer_hanchanId_fkey" FOREIGN KEY ("hanchanId") REFERENCES "Hanchan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HanchanPlayer" ADD CONSTRAINT "HanchanPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_hanchanId_fkey" FOREIGN KEY ("hanchanId") REFERENCES "Hanchan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_dealerPlayerId_fkey" FOREIGN KEY ("dealerPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Naki" ADD CONSTRAINT "Naki_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Naki" ADD CONSTRAINT "Naki_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Naki" ADD CONSTRAINT "Naki_targetPlayerId_fkey" FOREIGN KEY ("targetPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riichi" ADD CONSTRAINT "Riichi_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riichi" ADD CONSTRAINT "Riichi_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
