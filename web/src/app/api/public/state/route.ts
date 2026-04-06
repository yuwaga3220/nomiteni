// 開催状況と参加者情報を含む状態を取得(大会の開催状況の公開用)

import { NextResponse } from "next/server";
import { buildPublicState } from "@/lib/tournament-service";

// 状態を取得
export async function GET() {
  const data = await buildPublicState(); // 開催状況と参加者情報を含む状態を取得
  return NextResponse.json(data);
}
