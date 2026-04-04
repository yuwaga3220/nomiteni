/**
 * 認証モジュール（認証の操作）
 */
import { Global, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AdminGuard } from "./guards/admin.guard";
import { ParticipantGuard } from "./guards/participant.guard";
import { SessionAuthGuard } from "./guards/session-auth.guard";

@Global()
@Module({
  providers: [AuthService, SessionAuthGuard, AdminGuard, ParticipantGuard],
  exports: [AuthService, SessionAuthGuard, AdminGuard, ParticipantGuard],
})
export class AuthModule {}
