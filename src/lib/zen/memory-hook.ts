export const MEMORY_HINT_MAX = 1200;

/** Pull the winning IG hook out of a Creative Brain / learning prompt block. */
export function hookFromMemoryHint(memoryHint: string | undefined): string | undefined {
  const match = memoryHint?.match(/過去表現較好的 Hook：「([^」]+)」/);
  const hook = match?.[1]?.trim();
  return hook || undefined;
}

/**
 * Always keep the learned Hook at the front so truncation cannot drop it
 * behind brand-memory prose.
 */
export function composeMemoryHint(parts: Array<string | undefined>, max = MEMORY_HINT_MAX): string {
  const cleaned = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));
  const learned = hookFromMemoryHint(cleaned.join("\n"));
  if (!learned) return [...new Set(cleaned)].join("\n").slice(0, max);
  const rest = cleaned
    .map((part) => part.replace(/過去表現較好的 Hook：「[^」]+」[。.]?/, "").trim())
    .filter(Boolean);
  const ordered = [`過去表現較好的 Hook：「${learned}」`, ...rest];
  return [...new Set(ordered)].join("\n").slice(0, max);
}
