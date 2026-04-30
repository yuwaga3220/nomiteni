// web/src/lib/server/index.ts
// サーバーで使うエクスポート

export { requireScopedAdminTournament } from "@/lib/admin-scope";
export { issueUniqueAdminPasscode } from "@/lib/admin-passcode";
export { createToken, toClientUser, verifySessionToken } from "@/lib/auth-server";
export { JWT_SECRET, SOCKET_ALLOWED_ORIGINS, isProduction, socketCorsOrigins } from "@/lib/config";
export { HttpError } from "@/lib/http-error";
export { getPrisma } from "@/lib/prisma";
export { jsonFromError } from "@/lib/route-utils";
export {
  entryPasscodeOnlySchema,
  entryPasscodeSchema,
  entrySchema,
  loginSchema,
  observerPasscodeSchema,
  selfCheckinSchema,
  signupSchema,
  tournamentSettingsSchema,
} from "@/lib/schemas";
export { getSession } from "@/lib/session-cookie";
export { requireAdmin, requireAnySession } from "@/lib/session-guards";
export type { SessionPayload } from "@/lib/session.types";
export { emitStateUpdate, setIo } from "@/lib/socket-registry";
export { createTournamentWithSettings } from "@/lib/tournament-create";
export {
  attachWinnerToNext,
  broadcastState,
  buildPublicState,
  getActiveTournamentByEntryPasscode,
  getBracketSize,
  resolveAutomaticMatches,
  shuffle,
  updateTournamentStatus,
} from "@/lib/tournament-service";
