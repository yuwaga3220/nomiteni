/**
 * 設定（アプリケーションの設定）
 */
export const PORT = Number(process.env.PORT ?? 4000);
export const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
export const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "admin123";
export const COURT_KEY = "courtCount";

export const SOCKET_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];
export const ALLOWED_ORIGINS = Array.from(
  new Set(
    [
      ...(process.env.CLIENT_ORIGIN?.split(",").map((v) => v.trim()).filter(Boolean) ?? []),
      ...SOCKET_ALLOWED_ORIGINS,
    ],
  ),
);

/** 本番では明示リストのみ。開発時はリクエストの Origin をそのまま許可（localhost / 127.0.0.1 の取り違え対策）。 */
export const isProduction = process.env.NODE_ENV === "production";
