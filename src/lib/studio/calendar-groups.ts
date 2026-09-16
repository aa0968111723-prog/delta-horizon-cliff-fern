import { packRootId } from "./convert-pack.ts";
import { startOfLocalDay } from "./schedule.ts";
import type { Project } from "./types.ts";

type PackMember = Pick<Project, "id" | "convertedFromId">;

export type SameNightPack<T> = {
  rootId: string;
  members: T[];
  at: number;
};

export type GroupedContent<T> =
  | { type: "content"; project: T; at: number }
  | { type: "pack"; rootId: string; members: T[]; at: number };

/** 同一晚、同一套做成的貼文／限動／LINE 併成一組，月曆才不會變成 +3。 */
export function sameNightPacks<T extends PackMember>(
  items: Array<{ project: T; at: number }>,
): Array<SameNightPack<T>> {
  const seen = new Set<string>();
  const groups: Array<SameNightPack<T>> = [];
  for (const item of items) {
    const rootId = packRootId(item.project);
    const key = `${startOfLocalDay(item.at)}:${rootId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const members = items
      .filter((row) => packRootId(row.project) === rootId && startOfLocalDay(row.at) === startOfLocalDay(item.at))
      .map((row) => row.project);
    groups.push({ rootId, members, at: item.at });
  }
  return groups;
}

export function groupSameNightPacks<T extends PackMember>(
  items: Array<{ project: T; at: number }>,
): Array<GroupedContent<T>> {
  return sameNightPacks(items).map((group) =>
    group.members.length === 1
      ? { type: "content", project: group.members[0]!, at: group.at }
      : { type: "pack", rootId: group.rootId, members: group.members, at: group.at },
  );
}
