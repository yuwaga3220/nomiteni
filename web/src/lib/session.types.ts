// web/src/lib/session.types.ts
import type { UserRole } from "@prisma/client";

export type SessionPayload = { userId: number; role: UserRole; tournamentId?: number };
