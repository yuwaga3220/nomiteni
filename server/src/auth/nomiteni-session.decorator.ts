/**
 * セッションデコレーター（セッションの取得）
 */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { SessionPayload } from "./session.types";

export const NomiteniSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const s = req.nomiteniSession;
    if (!s) {
      throw new Error("NomiteniSession used without guard");
    }
    return s;
  },
);
