// web/src/lib/config.ts
// サーバー・API 用の設定

export const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
export const COURT_KEY = "courtCount";

// Socket.IO の許可元
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

// 本番環境かどうか
export const isProduction = process.env.NODE_ENV === "production";
// Socket.IO の CORS 許可元

export function socketCorsOrigins(): true | string[] {
  // 本番環境でない場合は全て許可
  if (!isProduction) return true;
  // 本番環境では環境変数から許可元を取得
  const fromEnv =
    process.env.CLIENT_ORIGIN?.split(",")
      .map((v) => v.trim())
      .filter(Boolean) ?? [];
  return Array.from(new Set([...fromEnv, ...SOCKET_ALLOWED_ORIGINS]));
}
