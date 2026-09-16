import { describeAudience } from "@/lib/zen/audience";
import { describeClub } from "@/lib/zen/club";
import { describeMoment } from "@/lib/zen/semester";
import { describeVoiceRules } from "@/lib/zen/voice";

/**
 * 每一次 AI 生成前都會讀的共同語境：
 * 品牌記憶 → 淡江學生 → 現在的學期情境 → 禪的轉譯與語氣。
 *
 * 這裡刻意不放任何行銷模板，讓模型講的是這個社團跟這群學生。
 */
export type ZenContextInput = {
  audienceIds?: string[];
  /** 覆寫品牌記憶（使用者在品牌頁改過的內容） */
  brandVoice?: string;
  brandDoSay?: string;
  brandDontSay?: string;
  forbiddenWords?: string[];
  imageStyle?: string;
  /** formatBrandMemory() 的產出，會蓋過預設的社團介紹 */
  brandMemoryText?: string;
  /** formatIgDna() 的產出，讓生成延續這個帳號自己的習慣 */
  igDnaText?: string;
  /** 覆寫「今天」，測試用 */
  now?: number;
};

export const ZEN_SYSTEM_PROMPT =
  "你是淡江大學禪學社的社群小編兼企劃，一個人包辦企劃、文案、設計與排程。" +
  "你的讀者是淡江大學的學生。你寫的東西要像真的社團人在發文，不是行銷公司的稿。" +
  "只輸出一個 JSON 物件，不要 markdown、不要說明文字。";

export function buildZenContext(input: ZenContextInput = {}): string {
  const now = input.now ? new Date(input.now) : new Date();
  const blocks = [
    "【品牌記憶】",
    input.brandMemoryText?.trim() || describeClub(),
    input.brandVoice ? `使用者設定的語氣：${input.brandVoice}` : "",
    input.brandDoSay ? `使用者設定可以說：${input.brandDoSay}` : "",
    input.brandDontSay ? `使用者設定不要說：${input.brandDontSay}` : "",
    input.forbiddenWords?.length ? `禁用詞：${input.forbiddenWords.join("、")}` : "",
    input.imageStyle ? `使用者設定的視覺風格：${input.imageStyle}` : "",
    input.igDnaText?.trim()
      ? `【這個帳號自己的 IG DNA】\n${input.igDnaText.trim()}\n生成時優先延續這些習慣，不要變成一般品牌帳號。`
      : "",
    "",
    "【唯一客群：淡江大學學生】",
    describeAudience((input.audienceIds ?? []) as never),
    "",
    "【現在的情境】",
    describeMoment(now),
    "",
    describeVoiceRules(),
    "",
    "【思考順序】",
    "1. 這跟淡江學生的生活有什麼關係？",
    "2. 他現在正在經歷什麼（開學／期中／期末／假期）？",
    "3. 淡水的天氣、捷運、宿舍、課表會不會影響這篇？",
    "4. 這篇內容淡江學生真的會停下來看嗎？",
    "5. 看完他知道要做什麼嗎（時間、地點、怎麼參加）？",
  ];
  return blocks.filter(Boolean).join("\n");
}

/** 從模型回覆裡挖出 JSON。模型偶爾會包 markdown 或前後加話。 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("模型未回傳 JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

export type ChatResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * 呼叫 xAI chat completions。伺服器端專用，金鑰不會離開伺服器。
 * 沒有金鑰時回傳 ok:false，呼叫端要退回本機草稿並誠實標示。
 */
export async function zenChat(options: {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  /** 圖片理解用：附上 image URL 或 data URL */
  imageUrls?: string[];
}): Promise<ChatResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "no-key" };

  const userContent = options.imageUrls?.length
    ? [
        { type: "text" as const, text: options.prompt },
        ...options.imageUrls.slice(0, 4).map((url) => ({
          type: "image_url" as const,
          image_url: { url },
        })),
      ]
    : options.prompt;

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 3000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ZEN_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `AI 服務回應 ${res.status}` };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) return { ok: false, error: "AI 沒有回傳內容" };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "無法連上 AI 服務" };
  }
}

export function aiAvailable(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}
