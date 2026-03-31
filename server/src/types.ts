import type { PrismaClient } from "@prisma/client";
import type { AuthHelpers } from "./auth.js";
import type { createTournamentService } from "./services/tournamentService.js";

export type TournamentService = ReturnType<typeof createTournamentService>;

export type RouteDeps = {
  prisma: PrismaClient;
  auth: AuthHelpers;
  tournamentService: TournamentService;
};
