/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Made the column `adminPasscode` on table `Tournament` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "TournamentAdmin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentAdmin_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "adminPasscode" TEXT NOT NULL,
    "eventDate" TEXT,
    "timeSlot" TEXT,
    "courtCount" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "observerPasscode" TEXT,
    "entryPasscode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tournament" ("adminPasscode", "courtCount", "createdAt", "entryPasscode", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot", "updatedAt") SELECT "adminPasscode", "courtCount", "createdAt", "entryPasscode", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_adminPasscode_key" ON "Tournament"("adminPasscode");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "partyJoin" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "canPlayToday" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("canPlayToday", "checkedIn", "createdAt", "email", "id", "name", "note", "partyJoin", "password", "updatedAt") SELECT "canPlayToday", "checkedIn", "createdAt", "email", "id", "name", "note", "partyJoin", "password", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAdmin_tournamentId_userId_key" ON "TournamentAdmin"("tournamentId", "userId");
