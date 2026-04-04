-- Tournament にスキーマ上あるが過去マイグレーションに含まれていなかったカラムを追加
ALTER TABLE "Tournament" ADD COLUMN "adminPasscode" TEXT;
ALTER TABLE "Tournament" ADD COLUMN "eventDate" TEXT;
ALTER TABLE "Tournament" ADD COLUMN "timeSlot" TEXT;
ALTER TABLE "Tournament" ADD COLUMN "courtCount" INTEGER NOT NULL DEFAULT 2;

UPDATE "Tournament" SET "adminPasscode" = 'adm-legacy-' || "id" WHERE "adminPasscode" IS NULL;

CREATE UNIQUE INDEX "Tournament_adminPasscode_key" ON "Tournament"("adminPasscode");
