-- The app does not use row timestamps, so remove timestamp columns from core data.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "partyJoin" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT
);
INSERT INTO "new_User" ("email", "id", "name", "note", "partyJoin", "password")
SELECT "email", "id", "name", "note", "partyJoin", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "adminPasscode" TEXT NOT NULL,
    "eventDate" TEXT,
    "timeSlot" TEXT,
    "courtCount" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'ENTRY',
    "observerPasscode" TEXT
);
INSERT INTO "new_Tournament" ("adminPasscode", "courtCount", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot")
SELECT "adminPasscode", "courtCount", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_adminPasscode_key" ON "Tournament"("adminPasscode");

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
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("courtNumber", "id", "nextMatchId", "player1Id", "player2Id", "position", "round", "status", "tournamentId", "winnerId")
SELECT "courtNumber", "id", "nextMatchId", "player1Id", "player2Id", "position", "round", "status", "tournamentId", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE UNIQUE INDEX "Match_tournamentId_round_position_key" ON "Match"("tournamentId", "round", "position");

CREATE TABLE "new_Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "initialPosition" INTEGER,
    CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("id", "initialPosition", "name", "tournamentId")
SELECT "id", "initialPosition", "name", "tournamentId" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
CREATE UNIQUE INDEX "Participant_tournamentId_initialPosition_key" ON "Participant"("tournamentId", "initialPosition");
CREATE INDEX "Participant_tournamentId_idx" ON "Participant"("tournamentId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
