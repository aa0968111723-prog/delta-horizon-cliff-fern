/** Shared server-only Grok chat helper. Never import from client except via createServerFn. */

const MAX_LIVE_PER_HOUR = 24;
const WINDOW_MS = 60 * 60 * 1000;

let windowStart = 0;
let liveCalls = 0;

export function grokApiKey(): string | undefined {
  const key = process.env.XAI_API_KEY?.trim();
  return key || undefined;
}

export function grokAvailable(): boolean {
  return Boolean(grokApiKey());
}

export function grokCapRemaining(): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (!windowStart || now - windowStart > WINDOW_MS) {
    windowStart = now;
    liveCalls = 0;
  }
  return { allowed: liveCalls < MAX_LIVE_PER_HOUR, remaining: Math.max(0, MAX_LIVE_PER_HOUR - liveCalls) };
}

/** Test helper — not used by the app. */
export function resetGrokCapForTests(calls = 0) {
  windowStart = Date.now();
  liveCalls = calls;
}

export type GrokChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string; capped?: boolean; status?: number };

export async function grokChat(input: {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
}): Promise<GrokChatResult> {
  const apiKey = grokApiKey();
  if (!apiKey) return { ok: false, error: "AI is not available" };

  const cap = grokCapRemaining();
  if (!cap.allowed) {
    return {
      ok: false,
      error: "今天的 AI 次數暫時用完了，先用本機草案繼續編輯。",
      capped: true,
    };
  }
  liveCalls += 1;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: input.temperature ?? 0.55,
      max_tokens: input.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `xAI API error ${res.status}`, status: res.status };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return { ok: true, text: body.choices?.[0]?.message?.content ?? "" };
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("模型未回傳 JSON");
  return JSON.parse(raw.slice(start, end + 1));
}
