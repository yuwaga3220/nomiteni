-- Users are administrator login accounts only. Remove profile fields and unused settings table.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

INSERT INTO "new_User" ("email", "id", "password")
SELECT "email", "id", "password"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

DROP TABLE IF EXISTS "AppSetting";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
