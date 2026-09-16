export const IMAGINE_IMAGE_MODEL = "grok-imagine-image-quality";

/** 生圖時固定帶上的社團畫面，避免變成通用禪風模板。 */
export const IMAGINE_CLUB_LOOK =
  "Tamkang University student life in Tamsui: campus slope, dorm desk, riverside dusk, classroom cushions, paper-white space, one warm accent light, small round turtle mascot with three soft glows on the shell is allowed";

export const IMAGINE_AVOID =
  "no lotus, no Buddha statue, no incense, no temple gold, no calligraphy poster, no AI glow halo, no religious iconography";

export const RATIO_HINT: Record<string, string> = {
  "4:5": "vertical 4:5 Instagram feed composition",
  "1:1": "square 1:1 Instagram feed composition",
  "9:16": "tall 9:16 vertical composition for Instagram story, keep the middle third clear for text",
  "1.91:1": "wide 1.91:1 landscape composition",
};

export const REVISION_PRESETS: { id: string; label: string; instruction: string }[] = [
  {
    id: "tku-life",
    label: "更像淡江生活",
    instruction: "keep the same scene but make it feel like Tamkang University student life in Tamsui: dorm, campus slope, riverside dusk, quiet and ordinary",
  },
  {
    id: "less-religion",
    label: "拿掉宗教感",
    instruction: "remove any religious, temple, Buddha, lotus, incense or gold-glow look; keep window light, cushions, paper-white calm",
  },
  {
    id: "story-space",
    label: "改成限動構圖",
    instruction: "reframe as a tall 9:16 story still with a clear empty band in the middle third for a short Chinese headline",
  },
  {
    id: "more-air",
    label: "更留白更安靜",
    instruction: "add more negative space, soften contrast, quieter documentary light, less decoration",
  },
];

export type ImagineImageHit = {
  b64?: string;
  url?: string;
  revisedPrompt?: string;
};

/** 文生圖與改版共用的 xAI Imagine 回傳解析。不自己生假圖。 */
export function imagineResultFromBody(body: unknown): ImagineImageHit | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data) || !data[0] || typeof data[0] !== "object") return null;
  const first = data[0] as { b64_json?: unknown; url?: string; revised_prompt?: string };
  const b64 = typeof first.b64_json === "string" ? first.b64_json : undefined;
  const url = typeof first.url === "string" ? first.url : undefined;
  if (!b64 && !url) return null;
  return {
    b64,
    url,
    revisedPrompt: typeof first.revised_prompt === "string" ? first.revised_prompt : undefined,
  };
}

export function buildGeneratePayload(prompt: string, ratio: string, styleHint?: string) {
  return {
    model: IMAGINE_IMAGE_MODEL,
    prompt: [
      prompt,
      styleHint?.trim(),
      RATIO_HINT[ratio] ?? RATIO_HINT["4:5"],
      IMAGINE_CLUB_LOOK,
      "soft natural light, airy negative space, muted warm neutral palette with one accent light, documentary photo feel, no text, no watermark",
      IMAGINE_AVOID,
    ]
      .filter(Boolean)
      .join(", "),
    n: 1,
    response_format: "b64_json" as const,
  };
}

export function buildEditPayload(input: {
  imageUrl: string;
  instruction: string;
  ratio?: string;
}) {
  const instruction = input.instruction.trim();
  return {
    model: IMAGINE_IMAGE_MODEL,
    prompt: [
      instruction,
      RATIO_HINT[input.ratio ?? "4:5"],
      "keep recognizable subjects from the source image",
      "documentary photo, no text, no watermark, no religious iconography, no Buddha, no lotus, no temple gold",
    ].join(", "),
    image: {
      url: input.imageUrl,
      type: "image_url" as const,
    },
    n: 1,
    response_format: "b64_json" as const,
  };
}

export function hitToDataUrl(hit: ImagineImageHit): string | null {
  if (hit.b64) return `data:image/png;base64,${hit.b64}`;
  return null;
}
