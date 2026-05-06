-- Store tournament participants independently from login users.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "initialPosition" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Participant" ("id", "tournamentId", "name", "initialPosition", "createdAt", "updatedAt")
SELECT
    "Participant"."id",
    "Participant"."tournamentId",
    COALESCE("User"."name", 'Player #' || "Participant"."id"),
    "Participant"."initialPosition",
    "Participant"."createdAt",
    "Participant"."updatedAt"
FROM "Participant"
LEFT JOIN "User" ON "User"."id" = "Participant"."userId";

DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
CREATE UNIQUE INDEX "Participant_tournamentId_initialPosition_key" ON "Participant"("tournamentId", "initialPosition");
CREATE INDEX "Participant_tournamentId_idx" ON "Participant"("tournamentId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
