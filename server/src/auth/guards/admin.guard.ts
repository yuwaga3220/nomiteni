/**
 * 管理者ガード（管理者のみ実行できる操作）
 */
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { Request } from "express";
import { AuthService } from "../auth.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const session = this.auth.readSession(req);
    if (!session) {
      throw new HttpException({ error: "ログインが必要です。" }, HttpStatus.UNAUTHORIZED);
    }
    if (session.role !== UserRole.ADMIN) {
      throw new HttpException({ error: "管理者のみ実行できます。" }, HttpStatus.FORBIDDEN);
    }
    req.nomiteniSession = session;
    return true;
  }
}
