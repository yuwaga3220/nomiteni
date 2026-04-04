/**
 * Expressの型定義
 */
import type { SessionPayload } from "../auth/session.types";

declare global {
  namespace Express {
    interface Request {
      nomiteniSession?: SessionPayload;
    }
  }
}

export {};
