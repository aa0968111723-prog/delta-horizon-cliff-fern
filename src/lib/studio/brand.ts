import { emptyBoilerplate } from "./boilerplate.ts";
import { uid } from "./ids.ts";
import type {
  BrandKit,
  BrandMemory,
  BrandRules,
  ImageStyle,
  LogoUsage,
  LogoVariant,
} from "./types.ts";

export function emptyBrandMemory(): BrandMemory {
  return {
    mission: "",
    fixedIntro: "",
    mascotName: "",
    mascotDescription: "",
    mascotAssetId: null,
    signatureVisual: "",
    likedStyles: [],
    dislikedStyles: [],
    audienceNotes: "",
    toneExamples: [],
    recurringEvents: [],
    igDna: "",
  };
}

export function migrateBrandMemory(raw: unknown): BrandMemory {
  const base = emptyBrandMemory();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Partial<BrandMemory>;
  const list = (v: unknown) =>
    Array.isArray(v) ? v.map((item) => String(item).trim()).filter(Boolean) : [];
  return {
    mission: row.mission ?? "",
    fixedIntro: row.fixedIntro ?? "",
    mascotName: row.mascotName ?? "",
    mascotDescription: row.mascotDescription ?? "",
    mascotAssetId: row.mascotAssetId ?? null,
    signatureVisual: row.signatureVisual ?? "",
    likedStyles: list(row.likedStyles),
    dislikedStyles: list(row.dislikedStyles),
    audienceNotes: row.audienceNotes ?? "",
    toneExamples: list(row.toneExamples),
    recurringEvents: list(row.recurringEvents),
    igDna: row.igDna ?? "",
  };
}

/** 給 AI prompt 用的 Brand Memory 摘要（每次生成前先讀）。 */
export function brandMemoryContext(brand: BrandKit): string {
  const m = brand.memory ?? emptyBrandMemory();
  const colors = brand.colors.map((c) => `${c.label} ${c.hex}`).join("、");
  return [
    `品牌：${brand.name} ${brand.handle}`,
    m.mission && `社團理念：${m.mission}`,
    m.fixedIntro && `固定介紹：${m.fixedIntro}`,
    m.mascotName && `角色：${m.mascotName}（${m.mascotDescription}）`,
    m.signatureVisual && `標誌視覺：${m.signatureVisual}`,
    colors && `品牌色：${colors}`,
    brand.voice && `語氣：${brand.voice}`,
    brand.doSay && `可說：${brand.doSay}`,
    brand.dontSay && `不說：${brand.dontSay}`,
    brand.forbiddenWords.length && `禁用詞：${brand.forbiddenWords.join("、")}`,
    m.likedStyles.length && `喜歡的風格：${m.likedStyles.join("、")}`,
    m.dislikedStyles.length && `不喜歡的風格：${m.dislikedStyles.join("、")}`,
    m.toneExamples.length && `語氣範例：\n- ${m.toneExamples.join("\n- ")}`,
    brand.ctas.length && `常用 CTA：${brand.ctas.join("／")}`,
    m.audienceNotes && `受眾筆記：${m.audienceNotes}`,
    m.recurringEvents.length && `常見活動：${m.recurringEvents.join("、")}`,
    m.igDna && `自己 IG 的 DNA：${m.igDna}`,
  ]
    .filter(Boolean)
    .join("\n");
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

export const LOGO_USAGE: { id: LogoUsage; label: string; hint: string }[] = [
  { id: "primary", label: "主標誌", hint: "預設放上畫布" },
  { id: "light", label: "淺底／正色", hint: "亞麻或淺色背景" },
  { id: "dark", label: "深底／反白", hint: "深色或照片上" },
  { id: "mark", label: "圖標", hint: "小尺寸、頭像、浮水印" },
  { id: "horizontal", label: "橫式", hint: "標題列、限動上緣" },
];

export function logoUsageLabel(usage: LogoUsage) {
  return LOGO_USAGE.find((item) => item.id === usage)?.label ?? usage;
}

export function defaultBrandColors() {
  return [
    { id: uid("c"), hex: "#1A1814", role: "primary" as const, label: "主色" },
    { id: uid("c"), hex: "#6F6A63", role: "secondary" as const, label: "輔助色" },
    { id: uid("c"), hex: "#F3F0EA", role: "background" as const, label: "背景色" },
    { id: uid("c"), hex: "#1E4A45", role: "accent" as const, label: "強調" },
    { id: uid("c"), hex: "#1A1814", role: "ink" as const, label: "文字" },
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
    memory: emptyBrandMemory(),
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
    memory: migrateBrandMemory(raw.memory),
    updatedAt: raw.updatedAt ?? Date.now(),
  };
}

export function imageStyleSummary(style: ImageStyle) {
  return [style.mood, style.lighting, style.paletteHint].filter(Boolean).join(" · ");
}
