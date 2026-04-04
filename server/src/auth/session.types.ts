/**
 * セッションの型定義
 */
import type { UserRole } from "@prisma/client";

export type SessionPayload = { userId: number; role: UserRole; tournamentId?: number };
