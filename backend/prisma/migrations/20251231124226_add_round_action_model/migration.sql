-- CreateEnum
CREATE TYPE "RoundActionType" AS ENUM ('NAKI', 'RIICHI');

-- CreateTable
CREATE TABLE "RoundAction" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" "RoundActionType" NOT NULL,
    "declaredAt" TIMESTAMP(3),
    "nakiType" "NakiType",
    "targetPlayerId" TEXT,
    "tiles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoundAction_roundId_idx" ON "RoundAction"("roundId");

-- CreateIndex
CREATE INDEX "RoundAction_playerId_idx" ON "RoundAction"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundAction_roundId_playerId_type_key" ON "RoundAction"("roundId", "playerId", "type");

-- AddForeignKey
ALTER TABLE "RoundAction" ADD CONSTRAINT "RoundAction_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundAction" ADD CONSTRAINT "RoundAction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundAction" ADD CONSTRAINT "RoundAction_targetPlayerId_fkey" FOREIGN KEY ("targetPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
