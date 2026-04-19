-- Add initial position per tournament participant
ALTER TABLE "UserTournamentRole" ADD COLUMN "initialPosition" INTEGER;

-- Keep position unique within a tournament/role when specified
CREATE UNIQUE INDEX "UserTournamentRole_tournamentId_role_initialPosition_key"
ON "UserTournamentRole"("tournamentId", "role", "initialPosition");
