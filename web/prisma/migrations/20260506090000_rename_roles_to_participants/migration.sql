-- Rename role assignment data into tournament participants.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "initialPosition" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Participant" ("id", "tournamentId", "userId", "initialPosition", "createdAt", "updatedAt")
SELECT "id", "tournamentId", "userId", "initialPosition", "createdAt", "updatedAt"
FROM "UserTournamentRole"
WHERE "role" = 'PARTICIPANT';

DROP TABLE "UserTournamentRole";
ALTER TABLE "new_Participant" RENAME TO "Participant";
CREATE UNIQUE INDEX "Participant_tournamentId_userId_key" ON "Participant"("tournamentId", "userId");
CREATE UNIQUE INDEX "Participant_tournamentId_initialPosition_key" ON "Participant"("tournamentId", "initialPosition");
CREATE INDEX "Participant_userId_idx" ON "Participant"("userId");
CREATE INDEX "Participant_tournamentId_idx" ON "Participant"("tournamentId");

-- Remove the no-longer-used participant passcode from tournaments.
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "adminPasscode" TEXT NOT NULL,
    "eventDate" TEXT,
    "timeSlot" TEXT,
    "courtCount" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'ENTRY',
    "observerPasscode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Tournament" ("adminPasscode", "courtCount", "createdAt", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot", "updatedAt")
SELECT "adminPasscode", "courtCount", "createdAt", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot", "updatedAt"
FROM "Tournament";

DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_adminPasscode_key" ON "Tournament"("adminPasscode");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
