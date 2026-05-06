// web/src/lib/session.types.ts
// セッションペイロードの型定義

// scopeの型定義
export type SessionScope = "login" | "observer" | "admin";

// セッションペイロードの型定義
export type SessionPayload = {
  userId?: number;
  scope?: SessionScope;
  tournamentId?: number;
};
