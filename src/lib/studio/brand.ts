import {
  CLUB_DONT_SAY,
  CLUB_DO_SAY,
  CLUB_INTRO_LONG,
  CLUB_INTRO_SHORT,
  CLUB_NAME,
  CLUB_VOICE,
  MASCOT,
  THREE_LIGHTS,
  VISUAL_ANCHORS,
} from "../zen/club.ts";
import { emptyBoilerplate } from "./boilerplate.ts";
import { uid } from "./ids.ts";
import type {
  BrandMemory,
  BrandKit,
  BrandMemory,
  BrandRules,
  IgHistoryReading,
  ImageStyle,
  LogoUsage,
  LogoVariant,
} from "./types.ts";

export function emptyBrandMemory(): BrandMemory {
  return {
    mission: "",
    audienceSegments: [],
    campusContexts: [],
    seasonalMoments: [],
    contentPillars: [],
    signatureElements: [],
    learnedPatterns: [],
    updatedAt: Date.now(),
  };
}

export function emptyImageStyle(): ImageStyle {
  return {
    mood: "",
    lighting: "",
    paletteHint: "",
    composition: "",
    do: "",
    dont: "",
  };
}

export function emptyBrandRules(): BrandRules {
  return {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "",
  };
}

export function emptyBrandMemory(): BrandMemory {
  return {
    mission: "",
    introShort: "",
    introLong: "",
    mascotName: "",
    mascotLook: "",
    mascotPersonality: "",
    mascotUsage: "",
    lights: THREE_LIGHTS.map((light) => ({
      label: light.label,
      hex: light.hex,
      meaning: light.meaning,
    })),
    likedStyles: "",
    dislikedStyles: "",
    legacyAssetIds: [],
    igReading: undefined,
  };
}

/** 禪學社的預設品牌記憶。品牌頁可以改，AI 會讀改過的版本。 */
export function clubBrandMemory(legacyAssetIds: string[] = []): BrandMemory {
  return {
    mission: "給淡江學生一個可以坐下來的地方。不是要你變好，是讓你先停一下。",
    introShort: CLUB_INTRO_SHORT,
    introLong: CLUB_INTRO_LONG,
    mascotName: MASCOT.name,
    mascotLook: MASCOT.look,
    mascotPersonality: MASCOT.personality,
    mascotUsage: MASCOT.usage,
    lights: THREE_LIGHTS.map((light) => ({
      label: light.label,
      hex: light.hex,
      meaning: light.meaning,
    })),
    likedStyles: `${VISUAL_ANCHORS.mood} 畫面可以用：${VISUAL_ANCHORS.subjects}`,
    dislikedStyles: VISUAL_ANCHORS.avoid,
    legacyAssetIds,
    igReading: undefined,
  };
}

function migrateIgReading(raw: unknown): IgHistoryReading | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Partial<IgHistoryReading>;
  const voice = String(row.voice ?? "").trim();
  if (!voice) return undefined;
  const list = (value: unknown) =>
    Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 6) : [];
  return {
    voice,
    continueWith: list(row.continueWith),
    avoid: list(row.avoid),
    nextPost: String(row.nextPost ?? "").trim(),
    analyzedAt: Number(row.analyzedAt) || Date.now(),
    sampleCount: Number(row.sampleCount) || 0,
    adapter: row.adapter === "live" ? "live" : "local",
  };
}

export function toggleLegacyAssetId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function legacyAssetNames(
  ids: string[],
  assets: { id: string; name: string }[] = [],
): string[] {
  return ids
    .map((id) => assets.find((asset) => asset.id === id)?.name?.trim())
    .filter((name): name is string => Boolean(name));
}

export function migrateBrandMemory(raw: Partial<BrandMemory> | undefined): BrandMemory {
  const base = emptyBrandMemory();
  if (!raw) return base;
  const lights = Array.isArray(raw.lights) && raw.lights.length
    ? raw.lights
        .map((item) => ({
          label: String(item?.label ?? "").trim() || "光",
          hex: String(item?.hex ?? "").trim() || "#3F9E93",
          meaning: String(item?.meaning ?? "").trim(),
        }))
        .filter((item) => item.label)
    : base.lights;
  return {
    mission: raw.mission ?? "",
    introShort: raw.introShort ?? "",
    introLong: raw.introLong ?? "",
    mascotName: raw.mascotName ?? "",
    mascotLook: raw.mascotLook ?? "",
    mascotPersonality: raw.mascotPersonality ?? "",
    mascotUsage: raw.mascotUsage ?? "",
    lights,
    likedStyles: raw.likedStyles ?? "",
    dislikedStyles: raw.dislikedStyles ?? "",
    legacyAssetIds: Array.isArray(raw.legacyAssetIds) ? raw.legacyAssetIds.filter(Boolean) : [],
    igReading: migrateIgReading(raw.igReading),
  };
}

/** 給 AI prompt 用的品牌記憶段落。空欄位會退回社團預設。 */
export function formatBrandMemory(
  memory?: BrandMemory | null,
  assets: { id: string; name: string }[] = [],
): string {
  const fallback = clubBrandMemory();
  const m = memory ?? fallback;
  const lights = (m.lights.length ? m.lights : fallback.lights)
    .map((light) => `${light.label} ${light.hex}（${light.meaning}）`)
    .join("；");
  const names = legacyAssetNames(m.legacyAssetIds, assets);
  const legacyLine = names.length
    ? `歷屆文宣：${names.join("、")}。生成時延續這些畫面的光、構圖與淡江生活感，不要變成一般海報。`
    : m.legacyAssetIds.length
      ? `歷屆文宣：已標記 ${m.legacyAssetIds.length} 張，生成時當成自己的視覺記憶。`
      : "";
  return [
    `社團：${CLUB_NAME}`,
    `理念：${m.mission || fallback.mission}`,
    `語氣：${CLUB_VOICE}`,
    `可以說：${CLUB_DO_SAY}`,
    `不要說：${CLUB_DONT_SAY}`,
    `短介紹：${m.introShort || fallback.introShort}`,
    `長介紹：${m.introLong || fallback.introLong}`,
    `吉祥物：${m.mascotName || fallback.mascotName}——${m.mascotLook || fallback.mascotLook}`,
    `個性：${m.mascotPersonality || fallback.mascotPersonality}`,
    `怎麼用：${m.mascotUsage || fallback.mascotUsage}`,
    `三色光：${lights}`,
    m.likedStyles ? `喜歡的風格：${m.likedStyles}` : `喜歡的風格：${fallback.likedStyles}`,
    m.dislikedStyles ? `不要的風格：${m.dislikedStyles}` : `不要的風格：${fallback.dislikedStyles}`,
    legacyLine,
  ]
    .filter(Boolean)
    .join("\n");
}

export const LOGO_USAGE: { id: LogoUsage; label: string; hint: string }[] = [
  { id: "primary", label: "主標誌", hint: "預設放上畫布" },
  { id: "light", label: "淺底／正色", hint: "紙白或淺色背景" },
  { id: "dark", label: "深底／反白", hint: "深色或照片上" },
  { id: "mark", label: "圖標", hint: "小尺寸、頭像、浮水印" },
  { id: "horizontal", label: "橫式", hint: "標題列、限動上緣" },
];

export function logoUsageLabel(usage: LogoUsage) {
  return LOGO_USAGE.find((item) => item.id === usage)?.label ?? usage;
}

export function defaultBrandColors() {
  return [
    { id: uid("c"), hex: "#1C1A16", role: "primary" as const, label: "墨" },
    { id: uid("c"), hex: "#5C6B66", role: "secondary" as const, label: "苔" },
    { id: uid("c"), hex: "#F3EEE4", role: "background" as const, label: "霧亞麻" },
    { id: uid("c"), hex: "#2A6A64", role: "accent" as const, label: "淡水" },
    { id: uid("c"), hex: "#1C1A16", role: "ink" as const, label: "文字" },
  ];
}

export function createEmptyBrand(name: string): BrandKit {
  return {
    id: uid("brand"),
    name: name.trim() || "未命名品牌",
    handle: "",
    website: "",
    voice: "",
    doSay: "",
    dontSay: "",
    forbiddenWords: [],
    colors: defaultBrandColors(),
    fontDisplay: "Noto Serif TC",
    fontBody: "Noto Sans TC",
    logoAssetId: null,
    logos: [],
    slogans: [],
    ctas: [],
    imageStyle: emptyImageStyle(),
    rules: emptyBrandRules(),
    boilerplate: emptyBoilerplate(),
    mascot: "",
    motifs: [],
    likes: [],
    dislikes: [],
    audienceNotes: "",
    updatedAt: Date.now(),
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function asLogos(raw: unknown, logoAssetId: string | null): LogoVariant[] {
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((item) => {
        const row = item as Partial<LogoVariant>;
        if (!row.assetId) return null;
        return {
          id: row.id || uid("logo"),
          name: row.name?.trim() || "Logo",
          assetId: row.assetId,
          usage: (row.usage as LogoUsage) || "primary",
        };
      })
      .filter((item): item is LogoVariant => Boolean(item));
  }
  if (logoAssetId) {
    return [
      {
        id: uid("logo"),
        name: "主標誌",
        assetId: logoAssetId,
        usage: "primary",
      },
    ];
  }
  return [];
}

export function migrateBrand(raw: Partial<BrandKit> & { id: string; name: string }): BrandKit {
  const logoAssetId = raw.logoAssetId ?? null;
  const logos = asLogos(raw.logos, logoAssetId);
  const primary = logos.find((item) => item.usage === "primary") ?? logos[0];
  return {
    id: raw.id,
    name: raw.name,
    handle: raw.handle ?? "",
    website: raw.website ?? "",
    voice: raw.voice ?? "",
    doSay: raw.doSay ?? "",
    dontSay: raw.dontSay ?? "",
    forbiddenWords: asStringArray(raw.forbiddenWords),
    colors: Array.isArray(raw.colors) && raw.colors.length ? raw.colors : defaultBrandColors(),
    fontDisplay: raw.fontDisplay ?? "Noto Serif TC",
    fontBody: raw.fontBody ?? "Noto Sans TC",
    logoAssetId: logoAssetId ?? primary?.assetId ?? null,
    logos,
    slogans: asStringArray(raw.slogans),
    ctas: asStringArray(raw.ctas),
    imageStyle: { ...emptyImageStyle(), ...(raw.imageStyle ?? {}) },
    rules: { ...emptyBrandRules(), ...(raw.rules ?? {}) },
    boilerplate: raw.boilerplate ?? emptyBoilerplate(),
    mascot: raw.mascot ?? "",
    motifs: asStringArray(raw.motifs),
    likes: asStringArray(raw.likes),
    dislikes: asStringArray(raw.dislikes),
    audienceNotes: raw.audienceNotes ?? "",
    updatedAt: raw.updatedAt ?? Date.now(),
  };
}

export function imageStyleSummary(style: ImageStyle) {
  return [style.mood, style.lighting, style.paletteHint].filter(Boolean).join(" · ");
}

export function brandMemoryBlock(
  brand: Pick<
    BrandKit,
    | "name"
    | "handle"
    | "voice"
    | "doSay"
    | "dontSay"
    | "forbiddenWords"
    | "colors"
    | "slogans"
    | "ctas"
    | "imageStyle"
  >,
) {
  const palette = brand.colors.map((color) => `${color.label} ${color.hex}`).join("、");
  return `Brand Memory（生成前先讀，不要從零開始）：
${brand.name} ${brand.handle}
語氣：${brand.voice}
可以說：${brand.doSay}
不要說：${brand.dontSay}
禁用：${brand.forbiddenWords.join("、") || "誠摯邀請"}
配色：${palette}
標語：${brand.slogans.join("／")}
CTA：${brand.ctas.join("／")}
畫面：${imageStyleSummary(brand.imageStyle)}。${brand.imageStyle.do}
不要拍：${brand.imageStyle.dont}
龜龜與三色光是配角。不要寺廟金、僧袍、滿版經文。`;
}
