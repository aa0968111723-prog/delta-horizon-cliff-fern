import type { MemoryItem } from "../club/memory.ts";
import type { VisionReport } from "./analyze.ts";

export function canvaOpenUrl(item: Pick<MemoryItem, "notes" | "source">) {
  const raw = item.notes?.trim() || "";
  if (item.source === "canva" && /^https:\/\/www\.canva\.com\//i.test(raw)) return raw;
  return "";
}

export function styleReportFromHit(
  item: Pick<MemoryItem, "title" | "notes" | "subtitle" | "source"> & { tags?: string[] },
): VisionReport {
  const blob = [item.title, item.subtitle, item.notes, ...(item.tags ?? [])].join(" ");
  const tea = /茶/.test(blob);
  const night = /夜|晚/.test(blob);
  const turtle = /龜/.test(blob);
  const lights = /三色|浮游|禪光/.test(blob);
  const canva = item.source === "canva";
  const ig = item.source === "instagram";
  return {
    content: tea
      ? "夜間茶會現場或文宣，有人圍坐、燈光偏暖。"
      : lights
        ? "三色光與留白，主視覺偏夜間室內。"
        : turtle
          ? "龜龜角色素材，可入鏡但不要卡通化。"
          : item.notes || item.title,
    people: /人|同學|互動|圍坐/.test(blob) ? "同學圍坐或側臉，不要網紅姿勢。" : "若有人，應保留側臉或手。",
    color: canva ? "延續這張的配色與留白，不要金箔廟宇色。" : lights ? "青／暖／玫瑰三色光，宣紙底。" : "宣紙與苔綠。",
    light: night ? "夜間暖光、柔和側光。" : "自然生活光，不要硬閃。",
    composition: canva ? "文字層級清楚，下半留給 Hook。" : ig ? "第一句先停，再進活動。" : "主體明確，留白多。",
    typeRatio: "字不要超過畫面三分之一。",
    hierarchy: "第一句 > 活動名 > 時間地點。",
    brandFeel: turtle || lights ? "可延續龜龜與三色光，不要廟宇。" : "延續品牌，不要複製舊排版。",
    studentFeel: "看起來要像淡江晚上，不是禪修中心廣告。",
    stayFeel: ig ? "先學這則的停留感與 Hook。" : "第一眼不要宗教符號。",
    tooReligious: "檢查有沒有蓮花、佛像、合十。",
    tooOld: canva ? "舊海報若太正式，資訊留下、層級重排。" : "避免過正式海報框。",
    tooAi: "皮膚過滑、手指數錯是警訊。",
    fitsTamkang: "加入捷運、宿舍、課表或淡水風會更真。",
    actions: [
      { id: "continue", label: "延續這個風格", detail: "用配色與構圖做新活動，不直接複製。" },
      { id: "redesign", label: "保留內容重新設計", detail: "資訊留下，層級重排。" },
      { id: "story", label: "做成限動", detail: "3–5 張，字更大。" },
      { id: "carousel", label: "做成 Carousel", detail: "Hook → 情境 → 痛點 → 內容 → CTA。" },
      { id: "reels", label: "做成 Reels Cover", detail: "9:16，字在安全區。" },
      { id: "similar", label: "生成相似視覺", detail: "同氣氛、新構圖。" },
    ],
    source: "mock",
  };
}

export function styleBriefFromReport(
  report: Pick<VisionReport, "color" | "composition" | "hierarchy" | "studentFeel">,
  sourceLabel: string,
) {
  return `${sourceLabel}：${report.color} ${report.composition} 層級：${report.hierarchy} ${report.studentFeel} 不要複製舊作品。`
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}
