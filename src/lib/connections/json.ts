export function parseJsonText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export function asObject(value: unknown): Record<string, unknown> | null {
  const parsed = parseJsonText(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null;
}

export function asText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function findRows(value: unknown, depth = 0): unknown[] {
  if (depth > 5) return [];
  const parsed = parseJsonText(value);
  if (Array.isArray(parsed)) return parsed;
  const row = asObject(parsed);
  if (!row) return [];
  for (const key of ["files", "items", "results", "entries", "data", "designs", "media"]) {
    if (key in row) {
      const found = findRows(row[key], depth + 1);
      if (found.length) return found;
    }
  }
  const content = row.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      const partObject = asObject(part);
      const found = findRows(partObject?.text ?? partObject?.data ?? part, depth + 1);
      if (found.length) return found;
    }
  }
  return [];
}

export function unixToIso(value: unknown) {
  if (typeof value === "number" && value > 0) {
    const ms = value > 10_000_000_000 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  const text = asText(value);
  if (!text) return "";
  if (/^\d+$/.test(text)) {
    const n = Number(text);
    const ms = n > 10_000_000_000 ? n : n * 1000;
    return new Date(ms).toISOString();
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

export function unwrapServerInput(input: unknown) {
  return input && typeof input === "object" && "data" in input
    ? (input as { data: unknown }).data
    : input;
}
