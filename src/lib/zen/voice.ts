import type { CampaignPainPoint, CampaignType, StudentReview, ToneId } from "../studio/types.ts";

/**
 * 淡江禪學社的語氣規則 + Hook 庫 + 反 AI 味檢查。
 * 「禪」先轉譯成：安定、專注、慢下來、認識自己、整理情緒、陪伴、喘口氣。
 */

export const ZEN_TRANSLATIONS = [
  "安定",
  "專注",
  "慢下來",
  "認識自己",
  "整理情緒",
  "陪伴",
  "自我探索",
  "喘口氣",
  "重新看見自己",
  "在人際和壓力中找到空間",
];

export const AVOID_WORDS = [
  "誠摯邀請",
  "敬邀",
  "蒞臨",
  "殊勝",
  "法喜",
  "功德",
  "開悟",
  "業障",
  "菩提",
  "般若",
  "涅槃",
  "無上",
  "眾生",
  "皈依",
  "限時瘋搶",
  "錯過就沒有",
  "爆款",
  "Z 世代",
  "年輕人",
  "大學生們",
];

/** AI 味的典型徵兆：太完整、太工整、每句像金句、大量破折號 / 抽象詞。 */
const AI_SMELL_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /——|—/g, label: "破折號太多" },
  { re: /在這個(快節奏|忙碌|喧囂)的(世界|時代|社會)/g, label: "「在這個快節奏的世界」是 AI 開場" },
  { re: /讓我們一起/g, label: "「讓我們一起」太像廣告" },
  { re: /不僅僅是|不只是.*更是/g, label: "「不只是…更是…」句型" },
  { re: /探索內心的(寧靜|平靜|力量)/g, label: "抽象詞堆疊" },
  { re: /心靈的(綠洲|港灣|棲息地)/g, label: "比喻太漂亮" },
  { re: /擁抱(自己|當下|生活)/g, label: "「擁抱當下」太勵志" },
  { re: /(✨|🌿|🧘|🙏){2,}/g, label: "emoji 堆疊" },
  { re: /誠摯邀請|敬邀|蒞臨/g, label: "太正式" },
];

export type AiSmellReport = { score: number; flags: string[] };

export function detectAiSmell(text: string): AiSmellReport {
  const flags: string[] = [];
  for (const { re, label } of AI_SMELL_PATTERNS) {
    if (re.test(text)) flags.push(label);
    re.lastIndex = 0;
  }
  const sentences = text.split(/[。！？\n]/).map((s) => s.trim()).filter(Boolean);
  const avgLen = sentences.length ? text.replace(/\s/g, "").length / sentences.length : 0;
  if (sentences.length >= 4 && sentences.every((s) => s.length >= 8 && s.length <= 22)) {
    flags.push("每句長度都一樣工整");
  }
  if (avgLen > 34) flags.push("句子偏長");
  const abstract = (text.match(/(內心|心靈|靈魂|生命|宇宙|能量|覺察|臨在)/g) ?? []).length;
  if (abstract >= 3) flags.push("抽象詞太多");
  const forbidden = AVOID_WORDS.filter((w) => text.includes(w));
  if (forbidden.length) flags.push(`用了「${forbidden.slice(0, 3).join("、")}」`);
  const score = Math.max(0, 100 - flags.length * 18);
  return { score, flags };
}

/* ------------------------------------------------------------------ */
/* Hook 庫                                                              */
/* ------------------------------------------------------------------ */

export const HOOKS_BY_PAIN: Record<CampaignPainPoint, string[]> = {
  stress: [
    "最近是不是連休息都覺得有罪惡感？",
    "報告寫到一半，突然不知道自己在幹嘛。",
    "你上次好好坐下來，什麼都不做，是什麼時候？",
    "期中前，先給自己五分鐘。",
  ],
  lonely: [
    "剛到淡水，晚餐還是一個人吃嗎？",
    "宿舍很熱鬧，但你有點想安靜一下。",
    "有時候需要的不是朋友很多，是有一個地方可以去。",
    "一個人也可以來，真的。",
  ],
  lost: [
    "大學生活很自由，但你最近真的有比較快樂嗎？",
    "不知道要什麼，也是一種需要被聽見的狀態。",
    "你不需要現在就有答案。",
    "大三了，還是不知道自己要幹嘛，正常嗎？",
  ],
  sleep: [
    "又滑到兩點了嗎？",
    "腦袋停不下來的晚上，我們在。",
    "睡不著不是你的問題，只是還沒找到讓它慢下來的方法。",
  ],
  focus: [
    "打開書十分鐘，手機已經拿起來三次。",
    "專注不是逼自己，是先讓自己安靜下來。",
    "你有多久沒有只做一件事了？",
  ],
  friends: [
    "在人群裡很累，一個人又有點空。",
    "有些話不想跟同學說，也不想跟家人說。",
    "不用聊天也可以一起坐著的地方。",
  ],
  curious: [
    "禪是什麼？其實我們也還在學。",
    "不用會打坐，不用信什麼，來坐一下就好。",
    "如果你以為禪＝宗教，這篇是給你看的。",
  ],
  belonging: [
    "想要一個去了不用表現什麼的地方嗎？",
    "有時候我們需要的不是答案，只是一個安靜的晚上。",
    "淡江有一個地方，週三晚上燈會亮著。",
  ],
};

export const HOOKS_BY_TYPE: Partial<Record<CampaignType, string[]>> = {
  tea: ["一杯茶的時間，剛好夠把今天放下。", "晚上七點，來喝茶，不用帶什麼。"],
  meditation: ["第一次靜坐，坐不住是正常的。", "十分鐘，什麼都不做，試過嗎？"],
  welcome: ["新生你好，淡水的風很大，記得帶外套。", "還沒選社團？先來坐一下再決定。"],
  recruit: ["這不是招生文，是想問你最近好不好。", "如果你路過社博攤位，可以什麼都不問，就坐一下。"],
  lecture: ["來聽一個晚上，聽完可以什麼都不做。", "不需要筆記的講座。"],
  retreat: ["離開淡水一天，什麼都不帶。", "一整天不看手機，你敢嗎？"],
  showcase: ["這學期，謝謝來過的每一個人。", "一學期的安靜，濃縮成一個晚上。"],
  class: ["每週三晚上，燈會亮著。", "社課不點名，來就好。"],
};

export function pickHooks(input: { painPoints: CampaignPainPoint[]; type: CampaignType; seed?: number }): string[] {
  const pool: string[] = [];
  for (const p of input.painPoints) pool.push(...(HOOKS_BY_PAIN[p] ?? []));
  pool.push(...(HOOKS_BY_TYPE[input.type] ?? []));
  if (!pool.length) pool.push(...HOOKS_BY_PAIN.belonging, ...HOOKS_BY_PAIN.stress);
  const seed = input.seed ?? 0;
  const rotated = [...pool.slice(seed % pool.length), ...pool.slice(0, seed % pool.length)];
  return [...new Set(rotated)];
}

/* ------------------------------------------------------------------ */
/* 語氣調整                                                             */
/* ------------------------------------------------------------------ */

export const TONE_GUIDE: Record<ToneId, string> = {
  short: "三行以內，每行不超過 18 字，像限動文字。",
  normal: "四到六行，講清楚活動、時間、地點、怎麼來，不囉唆。",
  warm: "多一點陪伴感，但不要詩意過頭，最多一句比喻。",
  student: "像淡江同學在自己帳號發文：口語、可以有一點自嘲、不要完整句。",
  life: "從淡水 / 宿舍 / 課表 / 捷運 / 天氣切入，活動只是順帶提到。",
  humor: "可以自嘲、可以吐槽期中考，但不要油、不要用網路爛梗。",
};

export function toneInstruction(tone: ToneId) {
  return TONE_GUIDE[tone];
}

/* ------------------------------------------------------------------ */
/* 反向學生模擬（本機版）                                                 */
/* ------------------------------------------------------------------ */

export function localStudentReview(input: {
  hook: string;
  body: string;
  cta: string;
  when?: string;
  where?: string;
  signupUrl?: string;
  hasImage?: boolean;
}): StudentReview {
  const all = `${input.hook}\n${input.body}\n${input.cta}`;
  const smell = detectAiSmell(all);
  const len = all.replace(/\s/g, "").length;
  const hookIsQuestion = /[？?]$/.test(input.hook.trim()) || /是不是|有沒有|嗎/.test(input.hook);
  const hookStartsWithClub = /^淡江大學禪學社|^禪學社/.test(input.hook.trim());
  const religious = /(佛|法師|禪師|經文|誦|殊勝|功德|法喜|皈依|菩提|開悟)/.test(all);
  const serious = /(誠摯|敬邀|蒞臨|請務必|規定|須知)/.test(all);
  const artsy = (all.match(/(靜謐|流淌|棲息|溫柔地|輕輕地|光影|微風|呢喃)/g) ?? []).length >= 2;
  const knowsWhat = /(茶會|靜坐|社課|講座|迎新|一日禪|活動|來坐|聚會)/.test(all);
  const whenWhere = Boolean(input.when && all.includes(input.when.slice(0, 2))) || /(\d{1,2}\/\d{1,2}|週[一二三四五六日]|[一二三四五六日]晚|點)/.test(all);
  const whereOk = Boolean(input.where && all.includes(input.where.slice(0, 2))) || /(教室|社辦|B\d|館|樓|淡水|校園)/.test(all);
  const signup = Boolean(input.signupUrl) || /(報名|私訊|留言|直接來|不用報名|連結)/.test(all);
  const friend = /(朋友|同學|一起|一個人也|室友)/.test(all);

  const wouldStop = hookIsQuestion || (!hookStartsWithClub && input.hook.length <= 26);
  const suggestions: string[] = [];
  if (hookStartsWithClub) suggestions.push("第一句先不要出現社團名，先講學生的狀態。");
  if (!hookIsQuestion && !wouldStop) suggestions.push("Hook 改成一個學生會點頭的問題。");
  if (religious) suggestions.push("拿掉宗教詞，用「安靜 / 慢下來 / 喘口氣」代替。");
  if (serious) suggestions.push("太正式了，像公文。改成同學在講話。");
  if (artsy) suggestions.push("形容詞太多，留一個就好。");
  if (smell.flags.length) suggestions.push(`有 AI 味：${smell.flags.slice(0, 2).join("、")}。`);
  if (len > 260) suggestions.push("太長了，IG 前兩行決定一切，後面砍一半。");
  if (!knowsWhat) suggestions.push("看完不知道活動是什麼，補一句「這是一場___」。");
  if (!whenWhere) suggestions.push("時間沒講清楚，直接寫「9/24（三）19:00」。");
  if (!whereOk) suggestions.push("地點沒講，寫教室或社辦。");
  if (!signup) suggestions.push("不知道怎麼參加：加一句「直接來就好」或「私訊報名」。");
  if (!friend) suggestions.push("加一句「可以找室友一起」，學生比較敢來。");

  const checks = [wouldStop, knowsWhat, whenWhere && whereOk, signup, !religious, !serious, !artsy, smell.flags.length === 0, len <= 260, friend];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const painHook = HOOKS_BY_PAIN.stress[0];
  const rewriteHook = hookStartsWithClub || !wouldStop ? painHook : input.hook;

  return {
    wouldStop,
    understandable: knowsWhat && len <= 320,
    tooReligious: religious,
    tooSerious: serious,
    tooArtsy: artsy,
    tooAi: smell.flags.length >= 2,
    tooLong: len > 260,
    knowsWhat,
    knowsWhenWhere: whenWhere && whereOk,
    wouldBringFriend: friend,
    knowsHowToSignup: signup,
    verdict:
      score >= 80
        ? "我會停下來看，而且知道要不要去。"
        : score >= 55
          ? "會滑過去一半，前兩行還可以更像在講我。"
          : "這看起來像公告，我會直接滑掉。",
    suggestions: suggestions.slice(0, 5),
    rewriteHook,
    score,
  };
}

/** 把「淡江大學禪學社誠摯邀請您…」這類開頭去掉。 */
export function deformalize(text: string) {
  return text
    .replace(/淡江大學禪學社誠摯邀請(您|你)[，,]?/g, "")
    .replace(/誠摯邀請(您|你)/g, "歡迎你")
    .replace(/蒞臨/g, "來")
    .replace(/敬邀/g, "邀你")
    .replace(/您/g, "你")
    .trim();
}
