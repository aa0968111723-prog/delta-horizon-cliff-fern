import { semesterPhaseAt } from "../zen/semester.ts";
import { HOOK_PATTERNS } from "../zen/voice.ts";
import { uid } from "./ids.ts";
import type { ContentKind } from "./types.ts";

export type TodayIdea = {
  id: string;
  title: string;
  hook: string;
  kind: ContentKind;
  why: string;
};

const PHASE_KINDS: Record<string, ContentKind[]> = {
  "pre-semester": ["ig-post", "story", "knowledge"],
  orientation: ["ig-post", "story", "carousel"],
  "club-fair": ["story", "ig-post", "carousel"],
  settling: ["ig-post", "knowledge", "member-story"],
  midterm: ["story", "knowledge", "countdown"],
  "post-midterm": ["ig-post", "carousel", "story"],
  final: ["story", "knowledge", "countdown"],
  "winter-break": ["recap", "member-story", "ig-post"],
  "summer-break": ["recap", "knowledge", "ig-post"],
};

/** 沒有 AI 時的今日題目：依學期階段挑 Hook，不編造成效數字。 */
export function localTodayIdeas(now = Date.now()): TodayIdea[] {
  const phase = semesterPhaseAt(new Date(now));
  const kinds = PHASE_KINDS[phase.id] ?? ["ig-post", "story", "knowledge"];
  return HOOK_PATTERNS.slice(0, 4).map((pattern, i) => ({
    id: uid("idea"),
    title: pattern.label,
    hook: pattern.example,
    kind: kinds[i % kinds.length]!,
    why: `${phase.label}：${pattern.why}`,
  }));
}
