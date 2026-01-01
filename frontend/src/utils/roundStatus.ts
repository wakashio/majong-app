import type { Round } from "../types/round";

export type RoundStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export function getRoundStatus(round: Round): RoundStatus {
  if (!round.startedAt && !round.endedAt) {
    return "NOT_STARTED";
  }
  if (round.startedAt && !round.endedAt) {
    return "IN_PROGRESS";
  }
  if (round.endedAt) {
    return "COMPLETED";
  }
  // この行は到達不可能だが、TypeScriptの型チェックのために必要
  return "NOT_STARTED";
}

export function getStatusText(status: RoundStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "未開始";
    case "IN_PROGRESS":
      return "進行中";
    case "COMPLETED":
      return "完了";
    default:
      return "不明";
  }
}

export function getStatusColor(status: RoundStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "grey";
    case "IN_PROGRESS":
      return "primary";
    case "COMPLETED":
      return "success";
    default:
      return "grey";
  }
}

