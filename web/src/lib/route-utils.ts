import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/http-error";

export function jsonFromError(e: unknown): NextResponse {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  if (e instanceof ZodError) {
    return NextResponse.json({ error: e.flatten() }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: "内部エラー" }, { status: 500 });
}
