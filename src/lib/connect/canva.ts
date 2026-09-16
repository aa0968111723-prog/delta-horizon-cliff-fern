import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { accessTokenFor } from "./tokens";
import { canvaBrief, canvaNameBase64, canvaSize, mapAutofillData, type CanvaCopy } from "./canva-format";

export type CanvaCreateResult =
  | {
      ok: true;
      connected: true;
      editUrl: string;
      title: string;
      designId: string;
      brief: string;
      placedImage: boolean;
      autofilled: boolean;
      note: string;
    }
  | { ok: true; connected: false; editUrl: string; title: string; brief: string; note: string }
  | { ok: false; connected: boolean; error: string; brief?: string };

export { canvaBrief, canvaSize } from "./canva-format";

const CanvaInput = z.object({
  title: z.string().min(1).max(80),
  hook: z.string().max(120).optional(),
  body: z.string().max(800).optional(),
  cta: z.string().max(40).optional(),
  format: z.string().max(40).optional(),
  palette: z.string().max(80).optional(),
  composition: z.string().max(120).optional(),
  headline: z.string().max(80).optional(),
  imageBase64: z.string().max(1_500_000).optional(),
  mime: z.string().max(40).optional(),
});

function parseCanvaInput(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "title" in inner) {
      return CanvaInput.parse(inner);
    }
  }
  return CanvaInput.parse(input);
}

function copyFrom(data: z.infer<typeof CanvaInput>): CanvaCopy {
  return {
    title: data.title.slice(0, 80),
    hook: data.hook || "",
    body: data.body || "",
    cta: data.cta || "來坐一下",
    palette: data.palette,
    composition: data.composition,
    headline: data.headline,
  };
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadCanvaAsset(token: string, imageBase64: string, title: string): Promise<string | null> {
  const bytes = Buffer.from(imageBase64, "base64");
  if (!bytes.length) return null;
  const start = await fetch("https://api.canva.com/rest/v1/asset-uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Asset-Upload-Metadata": JSON.stringify({ name_base64: canvaNameBase64(`${title} 主視覺`) }),
    },
    body: bytes,
  });
  if (!start.ok) return null;
  const started = (await start.json()) as { job?: { id?: string; status?: string; asset?: { id?: string } } };
  if (started.job?.asset?.id) return started.job.asset.id;
  const jobId = started.job?.id;
  if (!jobId) return null;
  for (let i = 0; i < 8; i++) {
    await wait(400);
    const poll = await fetch(`https://api.canva.com/rest/v1/asset-uploads/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!poll.ok) return null;
    const json = (await poll.json()) as { job?: { status?: string; asset?: { id?: string } } };
    if (json.job?.status === "success" && json.job.asset?.id) return json.job.asset.id;
    if (json.job?.status === "failed") return null;
  }
  return null;
}

async function tryAutofill(
  token: string,
  copy: CanvaCopy,
  imageAssetId?: string,
): Promise<{ editUrl: string; designId: string } | null> {
  const list = await fetch(
    `https://api.canva.com/rest/v1/brand-templates?limit=8&dataset=non_empty&query=${encodeURIComponent(copy.title.slice(0, 40))}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!list.ok) return null;
  const listed = (await list.json()) as { items?: { id: string; title?: string }[] };
  const template = listed.items?.[0];
  if (!template?.id) return null;
  const datasetRes = await fetch(`https://api.canva.com/rest/v1/brand-templates/${template.id}/dataset`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!datasetRes.ok) return null;
  const datasetJson = (await datasetRes.json()) as { dataset?: Record<string, { type?: string }> };
  const mapped = mapAutofillData(datasetJson.dataset ?? {}, copy, imageAssetId);
  if (!Object.keys(mapped).length) return null;
  const job = await fetch("https://api.canva.com/rest/v1/autofills", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "create_from_brand_template",
      brand_template_id: template.id,
      title: copy.title,
      data: mapped,
    }),
  });
  if (!job.ok) return null;
  const started = (await job.json()) as { job?: { id?: string; status?: string; result?: { design?: { id?: string; urls?: { edit_url?: string } } } } };
  const done = started.job?.result?.design;
  if (done?.id && done.urls?.edit_url) return { designId: done.id, editUrl: done.urls.edit_url };
  const jobId = started.job?.id;
  if (!jobId) return null;
  for (let i = 0; i < 8; i++) {
    await wait(400);
    const poll = await fetch(`https://api.canva.com/rest/v1/autofills/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!poll.ok) return null;
    const json = (await poll.json()) as {
      job?: { status?: string; result?: { design?: { id?: string; urls?: { edit_url?: string } } } };
    };
    const design = json.job?.result?.design;
    if (json.job?.status === "success" && design?.id && design.urls?.edit_url) {
      return { designId: design.id, editUrl: design.urls.edit_url };
    }
    if (json.job?.status === "failed") return null;
  }
  return null;
}

async function createSizedDesign(token: string, copy: CanvaCopy, format: string, assetId?: string) {
  const size = canvaSize(format);
  const body: Record<string, unknown> = {
    type: "type_and_asset",
    design_type: { type: "custom", width: size.width, height: size.height },
    title: copy.title,
  };
  if (assetId) body.asset_id = assetId;
  const res = await fetch("https://api.canva.com/rest/v1/designs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { design?: { id?: string; urls?: { edit_url?: string } } };
  const editUrl = json.design?.urls?.edit_url;
  const designId = json.design?.id;
  if (!editUrl || !designId) return null;
  return { editUrl, designId };
}

export const createCanvaDesign = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCanvaInput(input))
  .handler(async ({ data }): Promise<CanvaCreateResult> => {
    const copy = copyFrom(data);
    const brief = canvaBrief(copy);
    const bundle = await accessTokenFor("canva");
    if (!bundle) {
      return {
        ok: true,
        connected: false,
        editUrl: "https://www.canva.com/create",
        title: copy.title,
        brief,
        note: "尚未連接 Canva。先開空白畫布，文案已可貼上微調。",
      };
    }
    let assetId: string | undefined;
    if (data.imageBase64) {
      assetId = (await uploadCanvaAsset(bundle.accessToken, data.imageBase64, copy.title)) ?? undefined;
    }
    const autofilled = await tryAutofill(bundle.accessToken, copy, assetId).catch(() => null);
    if (autofilled) {
      return {
        ok: true,
        connected: true,
        editUrl: autofilled.editUrl,
        title: copy.title,
        designId: autofilled.designId,
        brief,
        placedImage: Boolean(assetId),
        autofilled: true,
        note: "已用品牌範本帶入文案。可在 Canva 微調。",
      };
    }
    const created = await createSizedDesign(bundle.accessToken, copy, data.format || "feed-portrait", assetId);
    if (!created) {
      return { ok: false, connected: true, error: "Canva 無法建立設計。可重新授權後再試。", brief };
    }
    return {
      ok: true,
      connected: true,
      editUrl: created.editUrl,
      title: copy.title,
      designId: created.designId,
      brief,
      placedImage: Boolean(assetId),
      autofilled: false,
      note: assetId ? "已把主視覺放進 IG 尺寸畫布，文案在剪貼簿。" : "已開 IG 尺寸畫布，文案在剪貼簿。",
    };
  });
