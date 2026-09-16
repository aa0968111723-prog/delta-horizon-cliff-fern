import { formatById } from "../studio/formats.ts";
import type { FormatId } from "../studio/types.ts";

const FORMAT_IDS: FormatId[] = [
  "feed-square",
  "feed-portrait",
  "feed-landscape",
  "story",
  "reels-cover",
  "threads",
  "line",
];

export type CanvaCopy = {
  title: string;
  hook: string;
  body: string;
  cta: string;
  palette?: string;
  composition?: string;
  headline?: string;
};

export type AutofillValue = { type: "text"; text: string } | { type: "image"; asset_id: string };

export function canvaSize(format: string): { width: number; height: number } {
  const id = FORMAT_IDS.includes(format as FormatId) ? (format as FormatId) : "feed-portrait";
  const spec = formatById(id);
  return { width: spec.width, height: spec.height };
}

export function canvaNameBase64(name: string) {
  const clipped = name.slice(0, 50);
  return Buffer.from(clipped, "utf8").toString("base64");
}

export function canvaBrief(input: CanvaCopy) {
  return [
    `標題：${input.title}`,
    `Hook：${input.hook}`,
    input.headline ? `主標：${input.headline}` : "",
    input.body,
    `CTA：${input.cta}`,
    input.palette ? `配色：${input.palette}` : "",
    input.composition ? `構圖：${input.composition}` : "",
    "延續淡江禪學社 DNA：霧園、靜水、三色光、龜龜可在角落。不要寺廟、不要宗教海報。",
    "把 Hook 放進畫面，時間地點不要當第一句。",
  ]
    .filter(Boolean)
    .join("\n");
}

export function mapAutofillData(
  dataset: Record<string, { type?: string }>,
  copy: CanvaCopy,
  imageAssetId?: string,
): Record<string, AutofillValue> {
  const out: Record<string, AutofillValue> = {};
  for (const [key, field] of Object.entries(dataset)) {
    const name = key.toLowerCase();
    if (field.type === "image") {
      if (imageAssetId) out[key] = { type: "image", asset_id: imageAssetId };
      continue;
    }
    if (field.type && field.type !== "text") continue;
    if (/cta|button|action|報名/.test(name)) {
      out[key] = { type: "text", text: copy.cta };
    } else if (/hook|headline|title|heading|標題|主標/.test(name)) {
      out[key] = { type: "text", text: copy.hook || copy.headline || copy.title };
    } else if (/body|caption|copy|sub|text|內文|說明/.test(name)) {
      out[key] = { type: "text", text: copy.body };
    }
  }
  return out;
}

export function parseCanvaDisplayName(json: unknown): string | undefined {
  const row = json as {
    team_user?: { display_name?: string };
    profile?: { display_name?: string };
    display_name?: string;
  };
  const name = row.team_user?.display_name || row.profile?.display_name || row.display_name;
  return name?.trim() || undefined;
}
