import { buildCampaignRhythm } from "./schedule.ts";
import { CLUB, DEFAULT_HASHTAGS } from "./identity.ts";
import { studentContext } from "./season.ts";
import { MEMORY_ITEMS } from "./memory.ts";
import { quotedHookFromLessons } from "./insights.ts";
import type { BriefInput } from "../ai/schema.ts";
import type { CampaignPlan, CarouselPagePlan, TemplateId } from "../studio/types.ts";

function clip(text: string, n = 12) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 2);
  return (lines.length ? lines : [text]).map((line) => (line.length > n ? line.slice(0, n) : line)).join("\n");
}

export function buildZenMockPlan(data: BriefInput): CampaignPlan {
  const ctx = studentContext();
  const name = data.eventName.trim();
  const when = data.schedule.trim() || "近期晚上";
  const where = data.location.trim() || "淡江校園";
  const cta = data.preferredCtas?.split(/[／/,，]/)[0]?.trim() || "來坐一下";
  const sloganHook = (data.slogans || "")
    .split(/[／/]/)
    .map((item) => item.trim())
    .find((item) => item.includes("？"));
  const learnedHook = quotedHookFromLessons(data.igLessons || "");
  const hook =
    sloganHook ||
    (learnedHook.includes("？") ? learnedHook : "") ||
    (ctx.phase === "finals"
      ? "最近是不是連休息都覺得有罪惡感？"
      : ctx.phase === "orientation"
        ? "剛到淡水的晚上，是不是還在找事情做？"
        : "最近是不是很久沒有好好坐下來？");
  const templateId: TemplateId = data.wantCarousel ? "product" : "editorial";
  const headline = clip(name.replace(/[（(].*$/, "") || "來坐一下");
  const pages: CarouselPagePlan[] = data.wantCarousel
    ? [
        { role: "cover", headline: clip(hook), subhead: `${name} · ${when}`, body: hook, cta, visualNote: "上半生活或光，下半第一句。", templateId: "product" },
        { role: "problem", headline: clip("連休息都有點罪惡？"), subhead: data.audience, body: ctx.calendarNote, cta, visualNote: "只留一句真話。", templateId: "quote" },
        { role: "detail", headline: clip(data.features || name), subhead: `${when} · ${where}`, body: data.features || "燈會先亮。人慢慢到。", cta, visualNote: "時間地點清楚。", templateId: "editorial" },
        { role: "proof", headline: clip("第一次來也沒關係"), subhead: "不懂禪也可以", body: "可以。帶朋友來也可以。", cta, visualNote: "現場或社員。", templateId: "product" },
        { role: "cta", headline: clip(cta), subhead: `${when} · ${where}`, body: "到了再找位子。", cta, visualNote: "只留時間地點 CTA。", templateId: "offer" },
        { role: "close", headline: clip("人到了就好。"), subhead: CLUB.name, body: `${when}，${where}。`, cta, visualNote: "可截圖。", templateId: "quote" },
      ]
    : [
        { role: "cover", headline, subhead: `${when} · ${where}`, body: hook, cta, visualNote: "單張三層資訊。", templateId },
      ];

  const related = MEMORY_ITEMS.filter((item) =>
    `${item.title}${item.tags.join()}`.includes(name.slice(0, 2)) || item.tags.some((tag) => name.includes(tag)),
  ).slice(0, 4);

  return {
    campaignName: name,
    concept: `把「${name}」講成淡江學生這週需要的一個晚上，而不是社團公告。`,
    insight: `${data.audience}要的是可以坐下的理由，不是更完整的介紹。時間（${when}）與地點（${where}）講清楚就夠。`,
    hook,
    visualTheme: data.imageStyle?.trim() || "夜間暖光、三色光、宣紙與苔綠。龜龜可小入鏡。",
    visualDirection: "主視覺不要做成廟宇海報。學生要看得出這是一個晚上、有位置、有人。",
    templateId,
    colorMood: "宣紙、苔綠、青／暖／玫瑰",
    eyebrow: when.slice(0, 12) || "NOW",
    headline: clip(hook),
    subhead: `${when} · ${where}`,
    body: data.features || "人到了就好。",
    cta,
    captions: [
      { style: "學生版", text: `${hook}\n\n${when}，${where}。\n${name}。\n人到了就好，想帶朋友來也可以。` },
      { style: "短版", text: `${hook}\n${when} ${name}。` },
      { style: "生活版", text: `從捷運走出來風都比較大的那種晚上，其實可以先去坐一下。\n${name}｜${when}｜${where}` },
    ],
    hashtags: [...DEFAULT_HASHTAGS, `#${name.replace(/\s+/g, "")}`.slice(0, 14)].filter(Boolean),
    storyBeats: data.wantStory ? [hook, `${when} ${where}`, `${cta}。人到了就好。`] : [],
    carouselPages: pages,
    assetNeeds: [
      { kind: "photo", title: "夜間或現場", detail: `能代表「${name}」的光或人。`, required: true },
      { kind: "illustration", title: "龜龜", detail: "可小入鏡。", required: false },
      { kind: "logo", title: "禪學社標誌", detail: "角落。", required: true },
    ],
    checklist: ["第一句不是公文", "時間地點有出現", "不太宗教", "不太像 AI 金句", "CTA 清楚"],
    altText: `${name}宣傳畫面，第一句是「${hook}」，標示${when}、${where}。`,
    qaNotes: [
      "避免佛光與說教",
      `現在是${ctx.phaseLabel}，語氣要對上學生這週。`,
      ...(data.igLessons ? [`成效回饋：${data.igLessons.split("\n")[0]}`] : []),
    ],
    generatedAt: Date.now(),
    source: "mock",
    directions: [
      {
        id: "dir_a",
        name: "坐下",
        concept: "用生活問句當封面，活動當第二層。",
        palette: "宣紙＋苔綠",
        composition: "上半人物或光，下半 Hook",
        typeDirection: "宋體大標，兩行以內",
        imagePrompt: `Tamkang student sitting in a warm dim room, soft tricolor lights cyan amber rose, paper texture, not temple, not golden buddha, quiet campus night, photoreal editorial, ${name}`,
        headline: clip(hook),
        subhead: name,
      },
      {
        id: "dir_b",
        name: "淡水晚上",
        concept: "從捷運與風講起，再進教室的燈。",
        palette: "水光＋暖光",
        composition: "橫向光帶，字在安全區",
        typeDirection: "短標＋時間",
        imagePrompt: `Tamsui evening wind after MRT, then cut to indoor warm lights, students not posing, Tamkang Zen club ${name}, naturalistic, no neon cyberpunk`,
        headline: clip("風比較大的晚上"),
        subhead: `${when} ${name}`,
      },
      {
        id: "dir_c",
        name: "帶朋友",
        concept: "強調可以兩個人來，降低第一次的壓力。",
        palette: "玫瑰光＋宣紙",
        composition: "兩人側影，不要正臉網紅",
        typeDirection: "口語一句＋CTA",
        imagePrompt: `two taiwanese college students sitting together in a quiet campus room, soft colored lights, turtle motif small, ${name} poster space, candid not influencer`,
        headline: clip("帶朋友來也可以"),
        subhead: `${where}`,
      },
    ],
    waves: buildCampaignRhythm({ eventDate: guessDate(data.schedule), eventType: name }),
    studentReview: {
      wouldStop: "第一句在問生活，比較有機會停。",
      understood: "活動名稱有出現。",
      tooReligious: "沒有佛學名詞。",
      tooSerious: "語氣偏晚上聊天。",
      tooLiterary: "仍要避免再改成詩。",
      tooAi: "短句即可，不要再補金句。",
      tooLong: "主畫面資訊三層。",
      knowsWhat: name,
      knowsWhenWhere: `${when} ${where}`,
      wouldBringFriend: "有寫可以帶朋友。",
      knowsSignup: cta,
      revisions: ["時間再靠近 CTA", "不要再加勵志句"],
    },
    reelsScript: data.wantReels
      ? [
          { start: 0, end: 3, visual: "捷運或風", caption: hook, voiceover: hook, transition: "切燈", assetHint: "淡水" },
          { start: 3, end: 7, visual: "燈亮", caption: name, voiceover: `${when}。`, transition: "疊字", assetHint: "三色光" },
          { start: 7, end: 12, visual: "有人坐下", caption: "人到了就好", voiceover: "沒有人要你懂禪。", transition: "慢推", assetHint: "現場" },
          { start: 12, end: 17, visual: "時間地點", caption: `${when} ${where}`, voiceover: "帶朋友來也可以。", transition: "卡片", assetHint: "主視覺" },
          { start: 17, end: 20, visual: "龜龜或 logo", caption: cta, voiceover: cta, transition: "淡出", assetHint: "龜龜" },
        ]
      : [],
    threadsPost: { caption: `${hook}\n${name}｜${when}｜${where}`, visualNote: "1:1 裁切主視覺。" },
    lineCopy: { title: `${name} ${when}`, body: `${hook} ${where}。`, cta },
    sources: [
      { kind: "brand", label: "Brand Memory / 龜龜與三色光" },
      ...related.map((item) => ({ kind: item.source, label: item.subtitle, id: item.id })),
    ],
  };
}

function guessDate(schedule: string) {
  const match = schedule.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  const md = schedule.match(/(\d{1,2})[./月](\d{1,2})/);
  if (md) return `2026-${md[1].padStart(2, "0")}-${md[2].padStart(2, "0")}`;
  return "2026-09-24";
}
