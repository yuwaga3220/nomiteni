-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "player1Id" INTEGER,
    "player2Id" INTEGER,
    "winnerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "courtNumber" INTEGER,
    "nextMatchId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("courtNumber", "createdAt", "id", "nextMatchId", "player1Id", "player2Id", "position", "round", "status", "tournamentId", "updatedAt", "winnerId") SELECT "courtNumber", "createdAt", "id", "nextMatchId", "player1Id", "player2Id", "position", "round", "status", "tournamentId", "updatedAt", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE UNIQUE INDEX "Match_tournamentId_round_position_key" ON "Match"("tournamentId", "round", "position");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
