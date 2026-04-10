-- CreateTable
CREATE TABLE "UserTournamentRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserTournamentRole_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTournamentRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserTournamentRole_userId_idx" ON "UserTournamentRole"("userId");

-- CreateIndex
CREATE INDEX "UserTournamentRole_tournamentId_role_idx" ON "UserTournamentRole"("tournamentId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "UserTournamentRole_tournamentId_userId_role_key" ON "UserTournamentRole"("tournamentId", "userId", "role");
