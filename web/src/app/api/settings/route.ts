import { NextResponse } from "next/server";
import { getCourtCount } from "@/lib/tournament-service";

// 設定を取得
export async function GET() {
  // レスポンスを返す
  return NextResponse.json({ courtCount: await getCourtCount() });
}
