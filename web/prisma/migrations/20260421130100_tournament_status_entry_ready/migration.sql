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
    "status" TEXT NOT NULL DEFAULT 'ENTRY',
    "observerPasscode" TEXT,
    "entryPasscode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tournament" ("adminPasscode", "courtCount", "createdAt", "entryPasscode", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot", "updatedAt") SELECT "adminPasscode", "courtCount", "createdAt", "entryPasscode", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_adminPasscode_key" ON "Tournament"("adminPasscode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
