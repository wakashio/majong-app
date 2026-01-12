-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "nakiType" "NakiType",
ADD COLUMN     "nakiTargetPlayerId" TEXT,
ADD COLUMN     "nakiTiles" TEXT[],
ADD COLUMN     "riichiDeclaredAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_nakiTargetPlayerId_fkey" FOREIGN KEY ("nakiTargetPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
