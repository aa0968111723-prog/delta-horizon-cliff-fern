import { z } from "zod";

const AlignModeSchema = z.enum([
  "left",
  "center",
  "right",
  "top",
  "middle",
  "bottom",
  "safe-left",
  "safe-center",
  "safe-right",
  "safe-top",
  "safe-middle",
  "safe-bottom",
]);

const LayerPatchSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  w: z.number().optional(),
  h: z.number().optional(),
  text: z.string().optional(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  fill: z.string().optional(),
  opacity: z.number().optional(),
  hidden: z.boolean().optional(),
  brightness: z.number().optional(),
  contrast: z.number().optional(),
  saturate: z.number().optional(),
  assetId: z.string().optional(),
});

export const EditorActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("update-layer"),
    layerId: z.string(),
    patch: LayerPatchSchema,
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("align-layer"),
    layerId: z.string(),
    mode: AlignModeSchema,
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("delete-layer"),
    layerId: z.string(),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("add-text"),
    text: z.string(),
    name: z.string().optional(),
    role: z.enum(["eyebrow", "headline", "subhead", "body", "cta", "handle", "custom"]).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    w: z.number().optional(),
    h: z.number().optional(),
    fontSize: z.number().optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    color: z.string().optional(),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("add-qr"),
    payload: z.string(),
    caption: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    size: z.number().optional(),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("replace-image"),
    layerId: z.string().optional(),
    prefer: z.enum(["brighter", "people", "background", "other"]).optional(),
    assetId: z.string().optional(),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("set-background"),
    color: z.string().optional(),
    color2: z.string().optional(),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("set-format"),
    formatId: z.enum([
      "feed-square",
      "feed-portrait",
      "feed-landscape",
      "story",
      "reels-cover",
      "threads",
      "line-promo",
    ]),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("apply-template"),
    templateId: z.enum(["editorial", "product", "offer", "quote"]),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("set-copy"),
    patch: z.object({
      eyebrow: z.string().optional(),
      headline: z.string().optional(),
      subhead: z.string().optional(),
      body: z.string().optional(),
      cta: z.string().optional(),
    }),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("whitespace"),
    amount: z.enum(["more", "less"]),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("layout-versions"),
    count: z.number().min(2).max(4).optional(),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("select"),
    layerId: z.string().nullable(),
    label: z.string().optional(),
  }),
]);

export const EditPlanSchema = z.object({
  summary: z.string(),
  risk: z.enum(["small", "large"]).optional(),
  actions: z.array(EditorActionSchema).max(24),
  notes: z.array(z.string()).max(12).optional(),
});

export type EditorAction = z.infer<typeof EditorActionSchema>;
export type EditPlan = z.infer<typeof EditPlanSchema>;

export function actionLabel(action: EditorAction): string {
  if (action.label) return action.label;
  switch (action.type) {
    case "update-layer":
      return "調整圖層";
    case "align-layer":
      return "對齊圖層";
    case "delete-layer":
      return "刪除圖層";
    case "add-text":
      return `新增文字「${action.text.slice(0, 12)}」`;
    case "add-qr":
      return "新增報名 QR";
    case "replace-image":
      return "更換圖片";
    case "set-background":
      return "改背景色";
    case "set-format":
      return "切換尺寸";
    case "apply-template":
      return "套用版型";
    case "set-copy":
      return "改文案";
    case "whitespace":
      return action.amount === "more" ? "增加留白" : "收緊留白";
    case "layout-versions":
      return "產生多個排版版本";
    case "select":
      return "選取圖層";
  }
}

export function riskOf(actions: EditorAction[]): "small" | "large" {
  if (actions.some((a) => a.type === "layout-versions" || a.type === "apply-template")) return "large";
  const deletes = actions.filter((a) => a.type === "delete-layer").length;
  if (deletes >= 2) return "large";
  const styleHits = actions.filter(
    (a) => a.type === "update-layer" || a.type === "set-background" || a.type === "set-copy" || a.type === "whitespace",
  ).length;
  if (actions.length >= 7) return "large";
  if (styleHits >= 5) return "large";
  return "small";
}
