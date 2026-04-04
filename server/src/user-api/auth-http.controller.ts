/**
 * 認証HTTPコントローラー
 */
import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { Request, Response } from "express";
import { adminLoginSchema, observerLoginSchema, participantLoginSchema, signupSchema } from "../schemas";
import { AuthService, toClientUser } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { TournamentService } from "../tournament/tournament.service";

@Controller("auth")
export class AuthHttpController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly tournamentService: TournamentService,
  ) {}

  @Post("signup")
  async signup(@Body() body: unknown) {
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const existing = await this.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) throw new HttpException({ error: "このメールアドレスは既に登録済みです。" }, HttpStatus.BAD_REQUEST);

    const user = await this.prisma.user.create({
      data: {
        email: parsed.data.email,
        password: parsed.data.password,
        role: UserRole.PARTICIPANT,
      },
    });
    return { ok: true, userId: user.id };
  }

  @Post("login")
  async participantLogin(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const parsed = participantLoginSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const user = await this.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      throw new HttpException(
        { error: "該当するアカウントがありません。先にサインアップしてください。" },
        HttpStatus.NOT_FOUND,
      );
    }
    if (user.password !== parsed.data.password) {
      throw new HttpException({ error: "パスワードが違います。" }, HttpStatus.UNAUTHORIZED);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.PARTICIPANT },
    });

    res.cookie("nomiteni_token", this.auth.createToken({ userId: user.id, role: UserRole.PARTICIPANT }), {
      httpOnly: true,
      sameSite: "lax",
    });
    await this.tournamentService.broadcastState();
    return { user: toClientUser({ ...user, role: UserRole.PARTICIPANT }) };
  }

  @Post("admin-login")
  async adminLogin(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const user = await this.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      throw new HttpException(
        { error: "該当するアカウントがありません。先にサインアップしてください。" },
        HttpStatus.NOT_FOUND,
      );
    }
    if (user.password !== parsed.data.password) {
      throw new HttpException({ error: "パスワードが違います。" }, HttpStatus.UNAUTHORIZED);
    }

    const tournament = await this.prisma.tournament.findUnique({ where: { adminPasscode: parsed.data.passcode } });
    if (!tournament) throw new HttpException({ error: "管理者パスコードが違います。" }, HttpStatus.UNAUTHORIZED);

    res.cookie(
      "nomiteni_token",
      this.auth.createToken({ userId: user.id, role: UserRole.ADMIN, tournamentId: tournament.id }),
      { httpOnly: true, sameSite: "lax" },
    );
    return { user: toClientUser({ ...user, role: UserRole.ADMIN }) };
  }

  @Post("observer-login")
  async observerLogin(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const parsed = observerLoginSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const user = await this.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      throw new HttpException(
        { error: "該当するアカウントがありません。先にサインアップしてください。" },
        HttpStatus.NOT_FOUND,
      );
    }
    if (user.password !== parsed.data.password) {
      throw new HttpException({ error: "パスワードが違います。" }, HttpStatus.UNAUTHORIZED);
    }

    const activeTournament = await this.tournamentService.getActiveTournament();
    if (!activeTournament || !activeTournament.observerPasscode) {
      throw new HttpException({ error: "観戦パスコードが未設定です。" }, HttpStatus.UNAUTHORIZED);
    }
    if (parsed.data.passcode !== activeTournament.observerPasscode) {
      throw new HttpException({ error: "観戦パスコードが違います。" }, HttpStatus.UNAUTHORIZED);
    }

    res.cookie("nomiteni_token", this.auth.createToken({ userId: user.id, role: UserRole.OBSERVER }), {
      httpOnly: true,
      sameSite: "lax",
    });
    return { user: toClientUser({ ...user, role: UserRole.OBSERVER }) };
  }

  @Get("me")
  async me(@Req() req: Request) {
    const session = this.auth.readSession(req);
    if (!session) return { user: null };
    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return { user: null };
    return { user: toClientUser({ ...user, role: session.role }) };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("nomiteni_token");
    return { ok: true };
  }
}
