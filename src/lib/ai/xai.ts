export function hasXai() {
  return Boolean(process.env.XAI_API_KEY);
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("模型未回傳 JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function xaiChat(
  messages: { role: "system" | "user" | "assistant"; content: unknown }[],
  opts?: { maxTokens?: number; json?: boolean; temperature?: number },
): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 2500,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return body.choices?.[0]?.message?.content ?? null;
}

export async function xaiImage(prompt: string, aspect: "1:1" | "4:5" | "9:16" = "4:5"): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt,
      n: 1,
      aspect_ratio: aspect,
      response_format: "b64_json",
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const first = body.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;
  return null;
}
