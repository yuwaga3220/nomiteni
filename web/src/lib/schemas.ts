// web/src/lib/schemas.ts
// Zod スキーマ

import { z } from "zod";

// アカウント（メール／パスワード）ログインスキーマ
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// サインアップ
export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(4).max(100),
});

// 観客パスコード
export const observerPasscodeSchema = z.object({
  passcode: z.string().min(4).max(64),
});

// トーナメント設定
export const tournamentSettingsSchema = z.object({
  name: z.string().min(1),
  eventDate: z.string().max(30).optional().nullable(),
  timeSlot: z.string().max(100).optional().nullable(),
  courtCount: z.number().int().min(1).max(32),
  observerPasscode: z.string().min(4).max(64),
});

export const tournamentStatusSchema = z.object({
  status: z.enum(["ENTRY", "READY", "RUNNING", "FINISHED"]),
});
