import { HOOK_BANK, HASHTAG_BANK } from "../club/identity.ts";
import type { CampaignPlan, CopyTone, CreativeDirection, ReelsBeat, StoryFrame, StudentSim } from "../studio/types.ts";
import type { BriefInput } from "./schema.ts";

export function applyStudentRevisions(
  copy: { tone: CopyTone; hook: string; body: string; cta: string; hashtags: string[] },
  sim: StudentSim,
  when?: string,
  where?: string,
) {
  let body = copy.body;
  if (sim.tooLong) {
    body = body.split("\n").filter(Boolean).slice(0, 5).join("\n");
  }
  if (!sim.knowsWhenWhere) {
    const line = [when, where].filter(Boolean).join(" · ");
    if (line && !body.includes(line)) body = `${body}\n${line}`;
  }
  if (!sim.wouldBringFriend && !body.includes("朋友")) {
    body = `${body}\n帶一個朋友來就好。`;
  }
  if (!sim.knowsHowToJoin && !/留言|連結|報名/.test(body)) {
    body = `${body}\n想來的話留言或點連結。`;
  }
  if (sim.tooReligious) {
    body = body.replace(/修行|開示|法會/g, "").replace(/\n{3,}/g, "\n\n");
  }
  return { ...copy, body: body.trim() };
}

export function mockStudentSim(input: {
  hook: string;
  caption: string;
  when: string;
  where: string;
  cta: string;
}): StudentSim {
  const caption = input.caption;
  const religious = /修行|開示|法會|佛|虔誠|往生/.test(caption);
  const formal = /誠摯邀請|敬邀|蒞臨/.test(caption);
  const long = caption.length > 280;
  const knowsWhenWhere = Boolean(input.when && input.where);
  const hasJoin = /報名|連結|來坐|留言/.test(`${caption}${input.cta}`);
  return {
    wouldStop: !formal && input.hook.length > 8,
    understandable: !religious,
    tooReligious: religious,
    tooSerious: formal,
    tooLiterary: /彷彿|宛如|靈魂深處/.test(caption),
    tooAi: /不僅.*更|在這個時代/.test(caption),
    tooLong: long,
    knowsWhat: /茶|光|坐|活動|晚上/.test(caption),
    knowsWhenWhere,
    wouldBringFriend: /朋友|一起/.test(caption),
    knowsHowToJoin: hasJoin,
    notes: [
      input.hook.includes("誠摯") ? "第一句還是太社團官方。" : "第一句有生活感。",
      knowsWhenWhere ? "時間地點有出現。" : "時間地點還不夠清楚。",
      religious ? "太宗教，學生會划走。" : "沒有一開始就講經。",
    ],
    revisions: [
      !knowsWhenWhere ? "補上星期、時間、地點。" : "",
      !hasJoin ? "告訴學生怎麼來：留言或連結。" : "",
      long ? "刪掉後段金句，留生活。" : "",
    ].filter(Boolean),
  };
}

function clip(text: string, n = 10) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((line) => (line.length > n ? line.slice(0, n) : line));
  return lines.join("\n") || text.slice(0, n);
}

export function mockDirections(name: string): CreativeDirection[] {
  return [
    {
      id: "dir_a",
      name: "夜間坐下",
      concept: "用淡水晚上的光，讓學生想停下來。",
      palette: "深底＋三色光（琥珀／淡水／蓮）",
      composition: "光在上半重疊，Hook 在下三分之一",
      typeDirection: "大標兩行，像對朋友講話",
      imagePrompt: `淡江淡水夜間校園聚會，三色光琥珀／淡水綠／蓮紅重疊，同學安靜喝茶，空氣感電影靜幀，不要寺廟僧袍，淺景深，IG 4:5，${name}`,
      headline: clip("最近是不是\n很久沒坐好"),
      subhead: `${name} · 一個晚上`,
    },
    {
      id: "dir_b",
      name: "朋友感",
      concept: "不是招生，是找人一起去一個不用熱場的地方。",
      palette: "霧亞麻、茶杯白、淡水綠",
      composition: "圍坐特寫、手與杯子，龜龜小配角",
      typeDirection: "口語短句，不要海報腔",
      imagePrompt: `室內茶會圍坐，手與杯子特寫，同學便服，淡江生活，角落一隻龜龜貼紙，霧亞麻與淡水綠，寫實編輯感，不要奢華、不要寺廟，${name}`,
      headline: clip("帶一個朋友\n就好"),
      subhead: "不用先懂禪",
    },
    {
      id: "dir_c",
      name: "淡水生活",
      concept: "從捷運與宿舍切入，再走到活動。",
      palette: "黃昏河岸、風、冷藍色溫",
      composition: "河岸或校園小路，人物背影",
      typeDirection: "像限動文字，不要詩",
      imagePrompt: `淡水黃昏河岸，剛下捷運的風，遠處校園燈，一個背書包的學生背影，自然攝影，低飽和底片色，不要觀光明信片，${name}`,
      headline: clip("捷運上滑完\n更累了"),
      subhead: "晚上其實可以停一下",
    },
  ];
}

export function mockStoryFrames(name: string, when: string, where: string): StoryFrame[] {
  return [
    { headline: HOOK_BANK[3], body: "課表開始了，人還在趕路。", visualNote: "捷運或宿舍窗", cta: "" },
    { headline: name, body: "燈光、熱茶、坐著就好。", visualNote: "三色光或杯子", cta: "" },
    { headline: "不用先懂禪", body: `${when}\n${where}`, visualNote: "時間地點大字", cta: "來坐一下" },
    { headline: "帶一個朋友", body: "現場也歡迎直接來。", visualNote: "龜龜或社員側影", cta: "報名" },
  ];
}

export function mockReels(name: string, when: string): ReelsBeat[] {
  return [
    { start: "0s", end: "3s", visual: "捷運窗或滑手機特寫", caption: "最近是不是很久沒坐好", voice: "小聲、像自言自語", transition: "切到光", assetHint: "通勤素材" },
    { start: "3s", end: "7s", visual: "三色光慢慢亮", caption: name, voice: "停半拍", transition: "溶到杯子", assetHint: "三色光" },
    { start: "7s", end: "12s", visual: "茶會手與杯子", caption: "不用分享，也不用會打坐", voice: "更鬆", transition: "切校園", assetHint: "茶會照片" },
    { start: "12s", end: "17s", visual: "圖書館前／小路", caption: when, voice: "把時間唸清楚", transition: "切大字", assetHint: "場地" },
    { start: "17s", end: "20s", visual: "Hook 大字＋龜龜", caption: "帶一個朋友來就好", voice: "收", transition: "結束", assetHint: "龜龜" },
  ];
}

export function buildZenMockPlan(data: BriefInput, directions: CreativeDirection[]): CampaignPlan {
  const name = data.eventName.trim();
  const when = data.schedule.trim() || "近期晚上";
  const where = data.location.trim() || "淡江校園";
  const hook = HOOK_BANK[3];
  const dir = directions[0];
  const caption = [
    hook,
    "",
    data.features.trim() || "燈光、熱茶、坐著就好。不用先懂禪。",
    `${when}，${where}。`,
    "想來的話帶一個朋友就好。",
  ].join("\n");
  const studentSim = mockStudentSim({ hook, caption, when, where, cta: "晚上來坐一下" });
  return {
    campaignName: name,
    concept: `${name}從「${hook}」進去，讓${data.audience}覺得這晚上跟自己有關。`,
    insight: data.audience,
    hook,
    visualTheme: dir.palette,
    visualDirection: `${dir.composition}。${dir.concept}`,
    templateId: "editorial",
    colorMood: dir.palette,
    eyebrow: "TONIGHT",
    headline: dir.headline,
    subhead: `${when} · ${where}`,
    body: data.features || "坐著就好。",
    cta: data.preferredCtas?.split(/[／/]/)[0]?.trim() || "晚上來坐一下",
    captions: [
      { style: "學生版", text: caption },
      { style: "短版", text: `${hook}\n${when} ${where}` },
      { style: "生活版", text: `捷運上總是在滑手機。\n${name}只是一個可以停的晚上。\n${when}，${where}。` },
    ],
    hashtags: HASHTAG_BANK.slice(0, 8),
    storyBeats: mockStoryFrames(name, when, where).map((f) => `${f.headline}｜${f.body}`),
    carouselPages: data.wantCarousel
      ? [
          { role: "cover", headline: dir.headline, subhead: dir.subhead, body: hook, cta: "晚上來坐一下", visualNote: dir.composition, templateId: "product" },
          { role: "problem", headline: clip("課表有了\n人還在趕"), subhead: data.audience, body: "不是你不夠努力。", cta: "晚上來坐一下", visualNote: "生活痛點，不要說教", templateId: "quote" },
          { role: "detail", headline: clip("燈光熱茶\n坐著就好"), subhead: "不用分享心事", body: data.features || "來坐一下。", cta: "帶一個朋友", visualNote: "茶會", templateId: "editorial" },
          { role: "proof", headline: clip(where), subhead: "就在學校", body: "下了課走過去就好。", cta: "看時間地點", visualNote: "校園", templateId: "product" },
          { role: "cta", headline: clip("晚上來坐一下"), subhead: `${when} · ${where}`, body: "留言或點連結。", cta: "報名連結在這", visualNote: "只留 CTA", templateId: "offer" },
          { role: "close", headline: clip("不用先懂禪。"), subhead: data.brandName, body: `${when}，${where}。`, cta: "晚上來坐一下", visualNote: "一句話", templateId: "quote" },
        ]
      : [
          { role: "cover", headline: dir.headline, subhead: `${when} · ${where}`, body: hook, cta: "晚上來坐一下", visualNote: dir.composition, templateId: "editorial" },
        ],
    assetNeeds: [
      { kind: "photo", title: "夜間或茶會", detail: "生活感，不要寺廟。", required: true },
      { kind: "logo", title: "禪學社標誌", detail: "角落。", required: true },
      { kind: "illustration", title: "三色光／龜龜", detail: "品牌記憶。", required: false },
    ],
    checklist: ["Hook 是生活不是邀請函", "時間地點清楚", "不太宗教", "有朋友感", "CTA 看得到"],
    altText: `${name}宣傳畫面，標題「${dir.headline.replace("\n", " ")}」。`,
    qaNotes: ["避免金句堆疊", "學生視角再讀一次"],
    generatedAt: Date.now(),
    source: "mock",
    studentSim,
    directions,
    threadsPost: `${hook}\n${name}。${when}，${where}。不用先懂禪。`,
    lineCopy: `【${name}】${when} ${where}\n${hook}`,
    reelsScript: mockReels(name, when),
    sources: [],
    scheduleNotes: "生活 → 情緒 → 主視覺 → 倒數 → 回顧，不要連發招生。",
  };
}
