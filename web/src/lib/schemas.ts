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

// 参加者登録
export const entrySchema = z.object({
  tournamentPasscode: z.string().min(1),
  name: z.string().min(1),
  partyJoin: z.boolean().default(false),
  note: z.string().max(300).optional(),
});

// 参加者登録パスコードのみ
export const entryPasscodeOnlySchema = z.object({
  tournamentPasscode: z.string().min(1),
});

// 自己チェックイン
export const selfCheckinSchema = z.object({
  canPlayToday: z.boolean(),
});

// 観客パスコード
export const observerPasscodeSchema = z.object({
  passcode: z.string().min(4).max(64),
});

// エントリー用パスコード
export const entryPasscodeSchema = z.object({
  passcode: z.string().min(4).max(64),
});

// トーナメント設定
export const tournamentSettingsSchema = z.object({
  name: z.string().min(1),
  eventDate: z.string().max(30).optional().nullable(),
  timeSlot: z.string().max(100).optional().nullable(),
  courtCount: z.number().int().min(1).max(32),
  entryPasscode: z.string().min(4).max(64),
  observerPasscode: z.string().min(4).max(64),
});
