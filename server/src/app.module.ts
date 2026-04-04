/**
 * アプリケーションモジュール
 */
import { Module } from "@nestjs/common";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PublicModule } from "./public/public.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { TournamentModule } from "./tournament/tournament.module";
import { UserApiModule } from "./user-api/user-api.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TournamentModule,
    RealtimeModule,
    PublicModule,
    UserApiModule,
    AdminModule,
  ],
})
export class AppModule {}
