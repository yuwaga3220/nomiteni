import { NextResponse } from "next/server";

// ヘルスチェック
export async function GET() {
  // レスポンスを返す
  return NextResponse.json({ ok: true });
}
