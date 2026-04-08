// web/src/lib/session.types.ts
export type SessionScope = "login" | "participant" | "observer" | "admin";

export type SessionPayload = {
  userId: number;
  scope?: SessionScope;
  tournamentId?: number;
};
