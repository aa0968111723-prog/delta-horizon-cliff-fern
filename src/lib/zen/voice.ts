import { CLUB_NAME, CLUB_SHORT, LIGHTS, MASCOT } from "./club.ts";
import { audienceSummary } from "./audience.ts";
import { igDnaBlock } from "./insights.ts";
import { seasonContext } from "./season.ts";

export const ZEN_TRANSLATION = [
  "安定",
  "專注",
  "慢下來",
  "認識自己",
  "整理情緒",
  "陪伴",
  "自我探索",
  "生活感",
  "喘口氣",
  "重新看見自己",
  "在人際和壓力中找到空間",
] as const;

export const FORBIDDEN_CLUB_WORDS = [
  "誠摯邀請",
  "竭誠歡迎",
  "宗教",
  "玄學",
  "開示",
  "修行人",
  "功德",
  "法會",
  "加持",
  "業障",
  "破折號連發",
];

export const HOOK_EXAMPLES = [
  "最近是不是連休息都覺得有罪惡感？",
  "有時候我們需要的不是答案，只是一個安靜的晚上。",
  "大學生活很自由，但你最近真的有比較快樂嗎？",
  "最近是不是很久沒有好好坐下來？",
  "開學以後，行程一直被填滿。",
  "淡水的晚上其實很適合什麼都不做。",
];

export const ANTI_AI_RULES = `文案必須像淡江學生、社團的人在發 IG，而不是文案機器人。
禁止：過度完整、每句都像金句、大量破折號、抽象詞堆疊、過度勵志、過度詩意、過度漂亮。
禁止開頭：「${CLUB_NAME}誠摯邀請您」。
優先口語、有人味、偶爾不工整。禪要轉譯成：${ZEN_TRANSLATION.join("、")}。
不要一開始就堆佛學名詞或說教。目標是讓學生覺得「這好像跟我的生活有關」。`;

export function systemPrompt(
  kind: "copy" | "campaign" | "image" | "vision" | "review" | "inspire",
  extras?: { dnaNotes?: string; memoryNotes?: string },
) {
  const season = seasonContext();
  const liveDna = extras?.dnaNotes?.trim() ? `\n即時 IG 記憶：\n${extras.dnaNotes.trim()}` : "";
  const liveMemory = extras?.memoryNotes?.trim()
    ? `\nCreative Memory：\n${extras.memoryNotes.trim().slice(0, 2000)}`
    : "";
  const head = `你在為「${CLUB_NAME}」做一人網宣創作。使用者同時是企劃、文案、設計、社群編輯、排程者。
唯一客群是淡江大學學生，不要寫成抽象的「年輕人／Z 世代」。
學生樣貌：
${audienceSummary()}

現在時間：${season.todayIso}（${season.label}）
學生正在經歷：${season.studentNow}
淡水／校園：${season.campus}。${season.weather}
內容節奏：${season.contentHint}
吉祥物：${MASCOT}。活動常見視覺：${LIGHTS}。
${ANTI_AI_RULES}

${igDnaBlock()}${liveDna}${liveMemory}`;

  if (kind === "image") {
    return `${head}
圖像要有淡水夜晚、校園、朋友感、空氣感，避免寺廟香爐、金身佛像、過宗教、過老氣、過 AI 塑料感。`;
  }
  if (kind === "review") {
    return `${head}
你現在必須切換成「淡江學生視角」重看這則內容。用第一人稱短句回答會不會停下來。`;
  }
  if (kind === "vision") {
    return `${head}
分析畫面時標出：內容、人物、色彩、光線、構圖、文字比例、品牌感、學生感、停留感、是否太宗教／老氣／AI。`;
  }
  if (kind === "inspire") {
    return `${head}
你在研究大學生社群、校園活動、IG Carousel、Reels Cover、活動海報與視覺趨勢。
不要抄別人作品或帳號。只抽象成：構圖、配色、排版、Hook 形狀、內容形式，再轉成淡江禪學社自己的內容。
禁止「誠摯邀請」與宗教廣告。Hook 要像在講淡江學生的生活。`;
  }
  return `${head}
品牌對外名稱可用「${CLUB_SHORT}」。Hook 要比活動資訊先出現。時間地點必須在後段交代清楚。`;
}

export const COPY_STYLES = [
  { id: "short", label: "短版" },
  { id: "normal", label: "一般版" },
  { id: "tender", label: "感性版" },
  { id: "student", label: "學生版" },
  { id: "life", label: "生活版" },
  { id: "humor", label: "幽默版" },
] as const;

export type CopyStyleId = (typeof COPY_STYLES)[number]["id"];

export const COPY_KIND_OPTIONS = [
  { id: "event", label: "活動宣傳" },
  { id: "emotion", label: "情緒共鳴" },
  { id: "campus", label: "校園生活" },
  { id: "recruit", label: "招生" },
  { id: "member", label: "社員故事" },
  { id: "zen-life", label: "禪生活" },
  { id: "countdown", label: "倒數" },
  { id: "recap", label: "活動回顧" },
  { id: "knowledge", label: "知識型" },
  { id: "qa", label: "Q&A" },
  { id: "poll", label: "互動投票" },
  { id: "carousel", label: "Carousel" },
  { id: "reels", label: "Reels" },
  { id: "story", label: "Story" },
] as const;

export type CopyKindId = (typeof COPY_KIND_OPTIONS)[number]["id"];

export const COPY_KIND_IDS = COPY_KIND_OPTIONS.map((item) => item.id) as [CopyKindId, ...CopyKindId[]];
