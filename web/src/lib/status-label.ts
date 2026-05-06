import type { Match, Tournament } from "@/types";

type StatusValue = Match["status"] | Tournament["status"];

export function getStatusLabel(status: StatusValue): string {
  if (status === "READY") return "準備中";
  if (status === "RUNNING") return "進行中";
  return "終了";
}
