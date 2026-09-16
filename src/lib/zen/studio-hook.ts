import type { IgMemoryPost } from "../studio/types.ts";
import { hookFromMemoryHint } from "./memory-hook.ts";
import { learnFromIg } from "./insights.ts";
import { researchInspiration } from "./inspiration.ts";
import { igSearchHookBlock, searchTokens } from "./search.ts";

/** Alias extras like「晚上」must not steal a tea-party kit onto an unrelated seed caption. */
function hookTiedToIdea(hook: string, idea: string) {
  const compactIdea = idea.replace(/\s+/g, "");
  const compactHook = hook.replace(/\s+/g, "");
  if (compactIdea.length >= 4 && compactHook.includes(compactIdea.slice(0, 6))) return true;
  if (compactHook.length >= 4 && compactIdea.includes(compactHook.slice(0, 6))) return true;
  const inIdea = searchTokens(idea).filter((token) => idea.includes(token));
  return inIdea.some((token) => hook.includes(token));
}

/** The Hook this idea will actually use — matching IG, then what you marked 學生會停, then this event's shape. */
export function ideaStudioHook(
  posts: IgMemoryPost[],
  idea: string,
  eventName?: string,
): string {
  const matching = hookFromMemoryHint(igSearchHookBlock(posts, idea));
  if (matching && hookTiedToIdea(matching, idea)) return matching;
  const learning = learnFromIg(posts);
  if (learning.ranked[0]?.feel === "strong") return learning.bestHookShape;
  const research = researchInspiration({ idea, eventName, learning });
  const inspired = research.cards[0]?.headlineHint?.trim();
  if (inspired && /[？?]/.test(inspired)) return inspired;
  return matching || learning.bestHookShape;
}
