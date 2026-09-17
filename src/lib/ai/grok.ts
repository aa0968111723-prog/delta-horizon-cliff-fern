export function grokAvailable() {
  return false;
}

export async function grokChat(_input?: unknown) {
  return { ok: false as const, error: "unavailable" };
}

export function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
