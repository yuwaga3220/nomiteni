// web/src/lib/client/api.ts
// ブラウザで使う API クライアントと Socket.IO コネクタ

"use client";

import { io, type Socket } from "socket.io-client";

// API のベース URL を取得
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "";
}

let socketSingleton: Socket | null = null;

// Zod のエラーメッセージを作成
function messageFromZodishError(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const f = error as { formErrors?: unknown; fieldErrors?: unknown };
  const parts: string[] = [];
  // フォームエラーがある場合
  if (Array.isArray(f.formErrors)) {
    for (const x of f.formErrors) {
      if (typeof x === "string" && x) parts.push(x); // フォームエラーを追加
    }
  }
  // フィールドエラーがある場合
  if (f.fieldErrors && typeof f.fieldErrors === "object" && f.fieldErrors !== null) {
    for (const [k, v] of Object.entries(f.fieldErrors)) {
      if (Array.isArray(v)) {
        const msgs = v.filter((x): x is string => typeof x === "string");
        if (msgs.length) parts.push(`${k}: ${msgs.join(", ")}`); // フィールドエラーを追加
      }
    }
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

// API の失敗メッセージを読み取る
async function readApiFailureMessage(res: Response): Promise<string> {
  const text = await res.text();
  const statusHint = res.statusText ? ` ${res.status} ${res.statusText}` : ` ${res.status}`;
  // テキストが空の場合
  if (!text.trim()) {
    return `サーバーからの応答がありません。${statusHint}`;
  }
  // テキストをパース
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    // パースエラーの場合
    return `${text.replace(/\s+/g, " ").slice(0, 280).trim()}${statusHint}`;
  }
  // データが空の場合
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return `APIの応答を解釈できませんでした。${statusHint}`;
  }
  // データをオブジェクトに変換
  const o = data as Record<string, unknown>;
  // エラーがある場合（文字列）
  if (typeof o.error === "string" && o.error) {
    return `${o.error}（${res.status}）`;
  }
  // エラーがある場合（オブジェクト）
  if (o.error !== undefined && o.error !== null) {
    const z = messageFromZodishError(o.error);
    if (z) return `${z}（${res.status}）`;
    // JSON に変換
    try {
      return `${JSON.stringify(o.error)}（${res.status}）`;
    } catch {
      return `入力内容を確認してください（${res.status}）`;
    }
  }
  if (typeof o.message === "string" && o.message) {
    return `${o.message}（${res.status}）`;
  }

  // データをJSONに変換
  try {
    const raw = JSON.stringify(data);
    if (raw && raw !== "{}") {
      return `${raw.slice(0, 400)}${raw.length > 400 ? "…" : ""}（${res.status}）`;
    }
  } catch {
    // ignore
  }

  return `APIがエラーを返しました（${res.status}）。web で npx prisma migrate deploy を実行し、DB が最新か確認してください。`;
}

// Socket.IO コネクタを取得
export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket is browser-only");
  }
  if (!socketSingleton) {
    const base = getApiBase();
    const opts = {
      path: "/socket.io",
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    } as const;
    socketSingleton = base === "" ? io(opts) : io(base, { ...opts });
  }
  return socketSingleton;
}

// API を呼び出す
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  let res: Response;
  // リクエストを送信
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    const hint = base === "" ? "（同一オリジン）" : `（${base}）`;
    throw new Error(
      `API に接続できません${hint}。web で npm run dev を実行し、ターミナルにエラーが出ていないか確認してください。`,
    );
  }

  if (!res.ok) {
    throw new Error(await readApiFailureMessage(res));
  }
  return (await res.json()) as T;
}
