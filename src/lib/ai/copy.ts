import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CopyPack, CopyTone, CopyVariant } from "@/lib/studio/types";

const ToneSchema = z.enum(["短版", "一般版", "感性版", "學生版", "生活版", "幽默版"]);

const CopyRequestSchema = z.object({
  campaignName: z.string().min(1).max(160),
  hook: z.string().max(240),
  concept: z.string().max(500),
  schedule: z.string().max(120),
  location: z.string().max(120),
  audience: z.string().min(1).max(300),
  studentPain: z.string().max(500),
  cta: z.string().max(80),
  registrationUrl: z.string().max(500),
  brandVoice: z.string().max(500),
  brandMemory: z.string().max(2400).optional(),
  hashtags: z.array(z.string().max(60)).max(20),
  forceMock: z.boolean().optional(),
});

const CopyPackJsonSchema = z.object({
  variants: z.array(z.object({
    tone: ToneSchema,
    hook: z.string(),
    body: z.string(),
    cta: z.string(),
    hashtags: z.array(z.string()).max(15),
  })).min(1).max(6),
  studentReview: z.array(z.object({
    question: z.string(),
    pass: z.boolean(),
    feedback: z.string(),
  })).min(4).max(12),
  revisedCaption: z.string(),
  threads: z.string(),
  line: z.string(),
  storyFrames: z.array(z.string()).min(3).max(5),
  carouselPages: z.array(z.string()).min(3).max(8),
  reelsScript: z.array(z.object({
    timing: z.string(),
    visual: z.string(),
    subtitle: z.string(),
    voiceover: z.string(),
    transition: z.string(),
    assetSuggestion: z.string(),
  })).min(4).max(8),
});

export type CopyRequest = z.infer<typeof CopyRequestSchema>;

const TONES: CopyTone[] = ["短版", "一般版", "感性版", "學生版", "生活版", "幽默版"];

function cleanHashtags(tags: string[]) {
  return [...new Set(["#淡江大學", "#淡江禪學社", "#淡江生活", ...tags])]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.startsWith("#") ? tag : `#${tag}`)
    .slice(0, 10);
}

function eventFacts(data: CopyRequest) {
  return [data.schedule ? `時間｜${data.schedule}` : "", data.location ? `地點｜${data.location}` : ""]
    .filter(Boolean)
    .join("\n");
}

function naturalHook(data: CopyRequest) {
  if (data.hook && !/誠摯邀請|法喜|殊勝/.test(data.hook)) return data.hook;
  if (/期中|期末|報告|考試/.test(data.studentPain)) return "最近是不是連休息都覺得有罪惡感？";
  if (/朋友|新生|新關係/.test(data.studentPain)) return "剛到淡江，還在找一個可以自在待著的地方嗎？";
  return "最近是不是很久沒有好好坐下來？";
}

export function buildMockCopyPack(data: CopyRequest): CopyPack {
  const hook = naturalHook(data);
  const facts = eventFacts(data);
  const core = data.concept || `${data.campaignName}，留一點空間給最近很忙的自己。`;
  const cta = data.cta || "找朋友一起來";
  const hashtags = cleanHashtags(data.hashtags);
  const variants: CopyVariant[] = TONES.map((tone) => {
    const bodyByTone: Record<CopyTone, string> = {
      短版: `${core}\n\n${facts}`,
      一般版: `${hook}\n\n${core}\n\n不用先懂禪，也不用準備答案。來坐坐、整理最近的心情就好。\n\n${facts}`,
      感性版: `${hook}\n\n有時候我們需要的不是答案，只是一個能慢下來的晚上。\n${core}\n\n${facts}`,
      學生版: `${hook}\n\n課表、通勤、宿舍和訊息都先放一下。${core}\n可以自己來，也可以揪一個最近同樣很忙的朋友。\n\n${facts}`,
      生活版: `下課後先不要急著回完所有訊息。\n\n${core}\n不需要盤腿，也不會突然考你佛學名詞。\n\n${facts}`,
      幽默版: `腦袋開了 18 個分頁，卻找不到關閉按鈕嗎？\n\n${core}\n放心，不用會禪，也沒有隨堂考。\n\n${facts}`,
    };
    return { tone, hook: tone === "生活版" || tone === "幽默版" ? bodyByTone[tone].split("\n")[0] : hook, body: bodyByTone[tone], cta, hashtags };
  });
  const student = variants.find((item) => item.tone === "學生版") ?? variants[0];
  const revisedCaption = `${student.body}\n\n${cta}${data.registrationUrl ? `｜${data.registrationUrl}` : ""}\n\n${hashtags.join(" ")}`;
  return {
    variants,
    studentReview: [
      { question: "我會停下來嗎？", pass: true, feedback: "第一句先說學生正在經歷的事，沒有先報社團全名。" },
      { question: "我看得懂活動在做什麼嗎？", pass: Boolean(core), feedback: "已用生活語言說明；避免只留下抽象情緒。" },
      { question: "是不是太宗教或太嚴肅？", pass: !/殊勝|法喜|開悟|修行/.test(revisedCaption), feedback: "沒有艱澀佛學詞，禪被轉成慢下來與整理情緒。" },
      { question: "是不是太像 AI？", pass: !/在這個快節奏|一場心靈|讓我們一起/.test(revisedCaption), feedback: "句型有長短與口語，不把每句寫成金句。" },
      { question: "時間地點清楚嗎？", pass: Boolean(data.schedule && data.location), feedback: data.schedule && data.location ? "時間與地點集中在文末。" : "仍缺時間或地點，發布前必須補上。" },
      { question: "我知道怎麼報名嗎？", pass: Boolean(data.registrationUrl), feedback: data.registrationUrl ? "已附報名連結。" : "尚未提供報名連結，文案不會假裝已完成。" },
    ],
    revisedCaption,
    threads: `${hook}\n\n${core}\n\n${facts}\n${cta}`,
    line: `【${data.campaignName}】\n${hook}\n${facts}\n${cta}${data.registrationUrl ? `：${data.registrationUrl}` : ""}`,
    storyFrames: [hook, data.studentPain || "最近有點滿，也很正常。", core, `${facts}\n${cta}`],
    carouselPages: [hook, data.studentPain || "最近停不下來嗎？", core, "不用懂禪，也可以自在參加。", `${facts}\n${cta}`],
    reelsScript: [
      { timing: "0–3 秒", visual: "下課鐘聲後仍盯著手機的手", subtitle: hook, voiceover: hook, transition: "快速切入後停半秒", assetSuggestion: "淡江下課走廊或通勤畫面" },
      { timing: "3–7 秒", visual: "課表、訊息與捷運畫面交替", subtitle: data.studentPain, voiceover: "最近是不是每件事都一起來？", transition: "三個生活片段節奏剪接", assetSuggestion: "課表截圖、捷運、宿舍桌面" },
      { timing: "7–12 秒", visual: "夜晚空間與同學自然坐著", subtitle: core, voiceover: core, transition: "節奏放慢、環境音進來", assetSuggestion: "活動場地與同學互動畫面" },
      { timing: "12–17 秒", visual: "茶、燈光、手部與笑聲細節", subtitle: "不用先懂禪", voiceover: "不用準備答案，來坐坐就好。", transition: "柔和疊化", assetSuggestion: "茶杯、三色光、手部特寫" },
      { timing: "17–20 秒", visual: "活動主視覺與資訊", subtitle: `${facts}\n${cta}`, voiceover: cta, transition: "定格兩秒", assetSuggestion: "品牌主視覺與 Logo" },
    ],
    generatedAt: Date.now(),
    source: "mock",
  };
}

function extractJson(text: string) {
  const raw = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("模型未回傳 JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

async function generateLive(data: CopyRequest): Promise<CopyPack> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.XAI_API_KEY}` },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.65,
      max_tokens: 5000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你是淡江大學禪學社的一人網宣 Copy Director。只輸出 JSON。文案必須像真的淡江社團同學，自然、具體、不說教、不過度宗教、不工整得像 AI。",
        },
        {
          role: "user",
          content: `請為以下活動產生完整 IG Copy Pack：${JSON.stringify(data)}。
variants 必須各有短版、一般版、感性版、學生版、生活版、幽默版，欄位 tone,hook,body,cta,hashtags。
studentReview 必須逐題回答：會停下來嗎、看得懂嗎、是否太宗教／太嚴肅／太文青／太 AI／太長、時間地點是否清楚、會想找朋友嗎、知道怎麼報名嗎；欄位 question,pass,feedback。
另外輸出 revisedCaption, threads, line, storyFrames(3–5), carouselPages(5–6), reelsScript(5 段，每段 timing,visual,subtitle,voiceover,transition,assetSuggestion)。
Hook 不可用「淡江大學禪學社誠摯邀請您」。先連結課表、通勤、宿舍、人際、壓力或淡水生活，再進活動。`,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`文案服務暫時無法使用（${response.status}）`);
  const body = await response.json() as { choices?: { message?: { content?: string } }[] };
  const parsed = CopyPackJsonSchema.parse(extractJson(body.choices?.[0]?.message?.content ?? ""));
  return { ...parsed, generatedAt: Date.now(), source: "live" };
}

export const generateCopyPack = createServerFn({ method: "POST" })
  .validator((input: unknown) => CopyRequestSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }) => {
    if (!process.env.XAI_API_KEY || data.forceMock) return { ok: true as const, pack: buildMockCopyPack(data) };
    try {
      return { ok: true as const, pack: await generateLive(data) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "文案生成失敗" };
    }
  });
