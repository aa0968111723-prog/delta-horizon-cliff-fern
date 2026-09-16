import type { CreativeHit } from "./search.ts";

function sourceLabel(source: CreativeHit["source"]) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  return "本機／品牌記憶";
}

function abstract(hit: CreativeHit): string {
  if (hit.source === "canva") return "抽配色、層級與留白，不要整張沿用。";
  if (hit.source === "instagram") return "學自己的 Hook 與 Caption 長度。";
  if (hit.source === "drive") return "用現場空氣與人，不要海報牆。";
  if (hit.source === "generated") return "當氣氛參考，再往學生生活靠。";
  return "當氣氛參考。";
}

/** Prefer the source the user came from, without making them pick files first. */
export function pickSourceRefs(mode: string, hits: CreativeHit[]): CreativeHit[] {
  if (mode === "from-canva") return hits.filter((h) => h.source === "canva").slice(0, 4);
  if (mode === "from-drive") return hits.filter((h) => h.source === "drive").slice(0, 4);
  if (mode === "from-ig") return hits.filter((h) => h.source === "instagram").slice(0, 4);
  if (mode === "from-image") return hits.filter((h) => h.source === "generated" || h.source === "local").slice(0, 4);
  return hits.slice(0, 6);
}

/** Style brief for generators — continue DNA, never duplicate the old poster. */
export function styleFromHits(hits: CreativeHit[]): string {
  if (!hits.length) return "延續淡江禪學社 DNA，不要複製舊作品。";
  const bits = hits.slice(0, 6).map((hit) => `${sourceLabel(hit.source)}「${hit.title}」：${abstract(hit)}`);
  bits.push("延續品牌 DNA，不要直接複製舊作品。");
  return bits.join(" ");
}

/** Picture-understanding card from Drive / Canva / IG hits — no upload required. */
export function visionFromHits(hits: CreativeHit[]) {
  if (!hits.length) return null;
  const drive = hits.filter((hit) => hit.source === "drive");
  const canva = hits.filter((hit) => hit.source === "canva");
  const ig = hits.filter((hit) => hit.source === "instagram");
  const titles = hits
    .slice(0, 4)
    .map((hit) => `${sourceLabel(hit.source)}「${hit.title}」`)
    .join("、");
  return {
    content: `從自己的素材讀到：${titles}。延續空氣與層級，不要複製舊海報。`,
    people: drive.length ? "Drive 裡有現場與同學互動，人物當空氣，不要擺拍。" : "人物不明顯，可留一個空位。",
    colors: canva.length ? "跟 Canva 抽霧園／靜水／琥珀，不要另起一套。" : "核對霧園／靜水／琥珀。",
    lighting: drive.length ? "晚上、淡水濕度、一點暖光。" : "光線層級待看。",
    composition: canva.length ? "跟歷屆排版抽層級與留白，封面不要活動全名牆。" : "下三分之一放問句。",
    textRatio: canva.length ? "字少、層級清楚。" : "封面幾乎無字。",
    hierarchy: canva.length ? "標題 → 一句人話 → CTA。" : "問句先，時間地點後。",
    brandFeel: "龜龜與三色光可當安靜記號，不要宗教符號。",
    studentFeel: "要像淡江學生會停下來，不像社團公告。",
    dwell: ig.length ? "學自己 IG 問句 Hook 的停留感。" : "問句與光點較容易停留。",
    tooReligious: false,
    tooOld: false,
    tooAi: false,
    fitsTamkang: true,
    suggestions: ["延續這個品牌 DNA，做新的活動", "做成限動", "做成 Carousel", "做成 Reels Cover"],
  };
}
