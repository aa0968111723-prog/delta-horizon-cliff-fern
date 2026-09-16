import { emptyBoilerplate } from "./boilerplate.ts";
import { uid } from "./ids.ts";
import type {
  BrandKit,
  BrandRules,
  ImageStyle,
  LogoUsage,
  LogoVariant,
} from "./types.ts";

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
    updatedAt: raw.updatedAt ?? Date.now(),
  };
}

export function imageStyleSummary(style: ImageStyle) {
  return [style.mood, style.lighting, style.paletteHint].filter(Boolean).join(" · ");
}
