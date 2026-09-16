export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
};

export type ChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string; missingKey?: boolean; status?: number };

export function hasXaiKey() {
  return Boolean(process.env.XAI_API_KEY);
}

export async function chatGrok(input: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<ChatResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI 目前無法使用", missingKey: true };

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(18_000),
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxTokens ?? 3200,
        response_format: { type: "json_object" },
        messages: input.messages,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `AI 暫時無法使用（${res.status}）`, status: res.status };
    }

    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { ok: true, text: body.choices?.[0]?.message?.content ?? "" };
  } catch {
    return { ok: false, error: "AI 回應超時" };
  }
}

export async function imagineImage(input: {
  prompt: string;
  n?: number;
}): Promise<{ ok: true; urls: string[] } | { ok: false; error: string; missingKey?: boolean }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "圖片生成目前無法使用", missingKey: true };

  try {
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model: "grok-imagine-image-quality",
        prompt: input.prompt,
        n: Math.min(3, Math.max(1, input.n ?? 1)),
        resolution: "1k",
        response_format: "url",
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `圖片生成暫時無法使用（${res.status}）` };
    }

    const body = (await res.json()) as { data?: { url?: string }[] };
    const urls = (body.data ?? []).map((row) => row.url).filter((url): url is string => Boolean(url));
    if (!urls.length) return { ok: false, error: "沒有產生圖片" };
    return { ok: true, urls };
  } catch {
    return { ok: false, error: "圖片生成超時" };
  }
}

export async function editImage(input: {
  prompt: string;
  imageUrls: string[];
}): Promise<{ ok: true; urls: string[] } | { ok: false; error: string; missingKey?: boolean }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "圖片改版目前無法使用", missingKey: true };

  const res = await fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image-quality",
      prompt: input.prompt,
      image_urls: input.imageUrls.slice(0, 3),
      n: 1,
      response_format: "url",
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `圖片改版暫時無法使用（${res.status}）` };
  }
  const body = (await res.json()) as { data?: { url?: string }[] };
  const urls = (body.data ?? []).map((row) => row.url).filter((url): url is string => Boolean(url));
  if (!urls.length) return { ok: false, error: "沒有產生改版圖片" };
  return { ok: true, urls };
}

export async function startImagineVideo(input: { prompt: string; imageUrl: string; duration?: number }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: "影片生成目前無法使用", missingKey: true as const };
  try {
    const res = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        model: "grok-imagine-video-1.5",
        prompt: input.prompt.slice(0, 800),
        image: { url: input.imageUrl },
        duration: Math.min(12, Math.max(5, input.duration ?? 10)),
      }),
    });
    if (!res.ok) return { ok: false as const, error: `影片暫時無法開始（${res.status}）` };
    const json = (await res.json()) as { request_id?: string };
    if (!json.request_id) return { ok: false as const, error: "影片沒有回傳工作編號" };
    return { ok: true as const, requestId: json.request_id };
  } catch {
    return { ok: false as const, error: "影片開始超時" };
  }
}

export async function pollImagineVideo(requestId: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: "影片生成目前無法使用", missingKey: true as const };
  try {
    const res = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false as const, error: `影片狀態暫時讀不到（${res.status}）` };
    const json = (await res.json()) as { status?: string; video?: { url?: string } };
    const status = json.status || "pending";
    if (status === "failed" || status === "expired") return { ok: false as const, error: "這次影片沒有完成" };
    const url = json.video?.url || "";
    if (status === "done" && /^https:\/\//.test(url)) return { ok: true as const, status: "done" as const, url };
    return { ok: true as const, status: "pending" as const, requestId };
  } catch {
    return { ok: false as const, error: "影片狀態超時" };
  }
}
