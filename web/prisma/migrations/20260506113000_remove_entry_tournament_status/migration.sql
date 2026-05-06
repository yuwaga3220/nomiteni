-- Entry flow was removed, so collapse ENTRY tournaments into READY and remove the status value.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "adminPasscode" TEXT NOT NULL,
    "eventDate" TEXT,
    "timeSlot" TEXT,
    "courtCount" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "observerPasscode" TEXT
);

INSERT INTO "new_Tournament" ("adminPasscode", "courtCount", "eventDate", "id", "name", "observerPasscode", "status", "timeSlot")
SELECT
    "adminPasscode",
    "courtCount",
    "eventDate",
    "id",
    "name",
    "observerPasscode",
    CASE WHEN "status" = 'ENTRY' THEN 'READY' ELSE "status" END,
    "timeSlot"
FROM "Tournament";

DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_adminPasscode_key" ON "Tournament"("adminPasscode");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
