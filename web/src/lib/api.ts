/**
 * API（バックエンドとの通信を管理）
 */
"use client";

import { io, type Socket } from "socket.io-client"; // Socket.IO クライアント

// API のベース URL を取得
// NEXT_PUBLIC_API_URL が設定されていればそれを返し、末尾のスラッシュを削除して返す
// 設定されていなければ空文字を返す
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim(); 
  if (raw) return raw.replace(/\/$/, ""); // 末尾のスラッシュを削除
  return "";
}

// Socket.IO クライアントを管理
let socketSingleton: Socket | null = null;

// Zod の flatten() などオブジェクト形式の error を短文にする関数
function messageFromZodishError(error: unknown): string | null {
  if (!error || typeof error !== "object") return null; 
  const f = error as { formErrors?: unknown; fieldErrors?: unknown };
  const parts: string[] = [];
  // formErrors が配列の場合
  if (Array.isArray(f.formErrors)) {
    for (const x of f.formErrors) { // 1文字ずつ配列を取り出し、文字列であればpartsに追加
      if (typeof x === "string" && x) parts.push(x); 
    }
  }
  // fieldErrors がオブジェクトの場合
  if (f.fieldErrors && typeof f.fieldErrors === "object" && f.fieldErrors !== null) {
    for (const [k, v] of Object.entries(f.fieldErrors)) { // キーと値を取り出し、値が配列の場合
      if (Array.isArray(v)) {
        const msgs = v.filter((x): x is string => typeof x === "string");
        if (msgs.length) parts.push(`${k}: ${msgs.join(", ")}`);
      }
    }
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

// API の失敗メッセージを読み取る
async function readApiFailureMessage(res: Response): Promise<string> {
  const text = await res.text();
  const statusHint = res.statusText ? ` ${res.status} ${res.statusText}` : ` ${res.status}`;

  if (!text.trim()) {
    return `サーバーからの応答がありません。${statusHint}`;
  }

  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    return `${text.replace(/\s+/g, " ").slice(0, 280).trim()}${statusHint}`;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return `APIの応答を解釈できませんでした。${statusHint}`;
  }

  const o = data as Record<string, unknown>;

  if (typeof o.error === "string" && o.error) {
    return `${o.error}（${res.status}）`;
  }
  if (o.error !== undefined && o.error !== null) {
    const z = messageFromZodishError(o.error);
    if (z) return `${z}（${res.status}）`;
    try {
      return `${JSON.stringify(o.error)}（${res.status}）`;
    } catch {
      return `入力内容を確認してください（${res.status}）`;
    }
  }

  if (typeof o.message === "string" && o.message) {
    return `${o.message}（${res.status}）`;
  }

  try {
    const raw = JSON.stringify(data);
    if (raw && raw !== "{}") {
      return `${raw.slice(0, 400)}${raw.length > 400 ? "…" : ""}（${res.status}）`;
    }
  } catch {
    /* ignore */
  }

  return `APIがエラーを返しました（${res.status}）。web で npx prisma migrate deploy を実行し、DB が最新か確認してください。`;
}

// Socket.IO クライアントを取得
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
  // API を呼び出す
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    // 成功した場合
    return (await res.json()) as T;
  } catch {
    // 失敗した場合
    const hint = base === "" ? "（同一オリジン）" : `（${base}）`;
    throw new Error(
      `API に接続できません${hint}。web で npm run dev を実行し、ターミナルにエラーが出ていないか確認してください。`,
    );
  }
  // 失敗した場合
  if (!res.ok) {
    throw new Error(await readApiFailureMessage(res));
  }
  return (await res.json()) as T;
}
