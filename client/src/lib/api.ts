import { io } from "socket.io-client";

export const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export const socket = io(API, { withCredentials: true, autoConnect: false });

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "通信に失敗しました");
  }
  return (await res.json()) as T;
}
