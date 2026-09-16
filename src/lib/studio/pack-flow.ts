import { applyFlowToProject, type FlowAction, type FlowActionId } from "./status.ts";
import type { Project } from "./types.ts";

export type PackFlowMember = Pick<Project, "id" | "status" | "scheduledAt" | "publishedAt">;

/** 全套一起走狀態。已發布的不會被「完成／排程」拉下來。 */
export function applyFlowToPack(
  members: PackFlowMember[],
  action: FlowActionId,
  at: number,
): Array<PackFlowMember> {
  return members.map((member) => {
    if ((action === "done" || action === "scheduled" || action === "making" || action === "unschedule") && member.status === "published") {
      return member;
    }
    return { id: member.id, ...applyFlowToProject(member, action, at) };
  });
}

/** 全套按鈕：一次標完、一次排進日曆、貼完一次標已發。 */
export function packFlowActions(members: Array<Pick<Project, "status">>): FlowAction[] {
  if (!members.length) return [];
  if (members.every((item) => item.status === "published")) {
    return [{ id: "unpublish", label: "這套還沒發", hint: "改回完成，還可以再改。" }];
  }
  const actions: FlowAction[] = [];
  if (members.some((item) => item.status === "idea" || item.status === "making")) {
    actions.push({ id: "done", label: "這套完成了", hint: "全套都可以發了。" });
  }
  const open = members.filter((item) => item.status !== "published");
  if (open.length) {
    if (open.some((item) => item.status !== "scheduled")) {
      actions.push({ id: "scheduled", label: "排這套到日曆", hint: "同一天晚上，之後可拖去改期。" });
    } else {
      actions.push({ id: "unschedule", label: "這套從日曆拿下來", hint: "改回完成，還可以再改期。" });
    }
    actions.push({ id: "published", label: "這套都發出去了", hint: "IG、Threads、LINE 都貼完再點。" });
  }
  return actions;
}
