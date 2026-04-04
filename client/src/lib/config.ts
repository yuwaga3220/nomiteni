/**
 * サーバー・API 用の設定
 */
export const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
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

export const isProduction = process.env.NODE_ENV === "production";

export function socketCorsOrigins(): true | string[] {
  if (!isProduction) return true;
  const fromEnv =
    process.env.CLIENT_ORIGIN?.split(",")
      .map((v) => v.trim())
      .filter(Boolean) ?? [];
  return Array.from(new Set([...fromEnv, ...SOCKET_ALLOWED_ORIGINS]));
}
