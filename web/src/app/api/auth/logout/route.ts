import { NextResponse } from "next/server";

// ログアウト
export async function POST() {
  const res = NextResponse.json({ ok: true }); // レスポンスを返す
  res.cookies.set("nomiteni_token", "", { httpOnly: true, path: "/", maxAge: 0 }); // トークンを削除
  return res;
}
