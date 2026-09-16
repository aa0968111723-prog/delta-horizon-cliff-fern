import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { accessTokenFor } from "./tokens";
import { canvaBrief, canvaPreset } from "./canva-format";

export type CanvaCreateResult =
  | { ok: true; connected: true; editUrl: string; title: string; designId: string }
  | { ok: true; connected: false; editUrl: string; title: string; brief: string; note: string }
  | { ok: false; connected: boolean; error: string };

export { canvaBrief, canvaPreset } from "./canva-format";

function parseCanvaInput(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "title" in inner) {
      return z
        .object({
          title: z.string().min(1).max(80),
          hook: z.string().max(120).optional(),
          body: z.string().max(800).optional(),
          cta: z.string().max(40).optional(),
          format: z.string().max(40).optional(),
          palette: z.string().max(80).optional(),
        })
        .parse(inner);
    }
  }
  return z
    .object({
      title: z.string().min(1).max(80),
      hook: z.string().max(120).optional(),
      body: z.string().max(800).optional(),
      cta: z.string().max(40).optional(),
      format: z.string().max(40).optional(),
      palette: z.string().max(80).optional(),
    })
    .parse(input);
}

export const createCanvaDesign = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCanvaInput(input))
  .handler(async ({ data }): Promise<CanvaCreateResult> => {
    const title = data.title.slice(0, 80);
    const brief = canvaBrief({
      title,
      hook: data.hook || "",
      body: data.body || "",
      cta: data.cta || "來坐一下",
      palette: data.palette,
    });
    const bundle = await accessTokenFor("canva");
    if (!bundle) {
      return {
        ok: true,
        connected: false,
        editUrl: "https://www.canva.com/create",
        title,
        brief,
        note: "尚未連接 Canva。先開空白畫布，把文案貼進去微調。",
      };
    }
    const preset = canvaPreset(data.format || "feed-portrait");
    const res = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bundle.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        design_type: { type: "preset", name: preset },
      }),
    });
    if (!res.ok) {
      return { ok: false, connected: true, error: `Canva 無法建立設計（${res.status}）。可重新授權後再試。` };
    }
    const json = (await res.json()) as {
      design?: { id?: string; urls?: { edit_url?: string } };
    };
    const editUrl = json.design?.urls?.edit_url;
    const designId = json.design?.id;
    if (!editUrl || !designId) {
      return { ok: false, connected: true, error: "Canva 沒有回傳編輯連結。" };
    }
    return { ok: true, connected: true, editUrl, title, designId };
  });
