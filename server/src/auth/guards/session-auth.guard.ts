/**
 * セッション認証ガード（セッションの認証）
 */
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth.service";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const session = this.auth.readSession(req);
    if (!session) {
      throw new HttpException({ error: "ログインが必要です。" }, HttpStatus.UNAUTHORIZED);
    }
    req.nomiteniSession = session;
    return true;
  }
}
