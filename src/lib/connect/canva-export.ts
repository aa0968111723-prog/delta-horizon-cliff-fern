import { canvaNameBase64, canvaSize } from "./canva-format.ts";

export function canvaExportBody(designId: string, width = 1080, height = 1350) {
  return {
    design_id: designId,
    format: { type: "png" as const, width, height },
  };
}

export function parseCanvaExportUrl(json: unknown): string | null {
  const job = (json as { job?: { status?: string; urls?: string[] } }).job;
  if (job?.status !== "success") return null;
  const url = job.urls?.[0];
  if (!url || !url.startsWith("https://")) return null;
  return url;
}

export function parseCanvaJobId(json: unknown): string | null {
  return (json as { job?: { id?: string } }).job?.id || null;
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadPng(token: string, imageBase64: string, title: string): Promise<string | null> {
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

async function createDesign(token: string, title: string, format: string, assetId: string) {
  const size = canvaSize(format);
  const res = await fetch("https://api.canva.com/rest/v1/designs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "type_and_asset",
      design_type: { type: "custom", width: size.width, height: size.height },
      title,
      asset_id: assetId,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { design?: { id?: string } };
  return json.design?.id || null;
}

export async function exportDesignPng(opts: {
  token: string;
  designId: string;
  width?: number;
  height?: number;
}): Promise<string | null> {
  const width = opts.width ?? 1080;
  const height = opts.height ?? 1350;
  const started = await fetch("https://api.canva.com/rest/v1/exports", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(canvaExportBody(opts.designId, width, height)),
  });
  if (!started.ok) return null;
  const startedJson = await started.json();
  const immediate = parseCanvaExportUrl(startedJson);
  if (immediate) return immediate;
  const jobId = parseCanvaJobId(startedJson);
  if (!jobId) return null;
  for (let i = 0; i < 8; i++) {
    await wait(500);
    const poll = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
      headers: { Authorization: `Bearer ${opts.token}` },
    });
    if (!poll.ok) return null;
    const url = parseCanvaExportUrl(await poll.json());
    if (url) return url;
  }
  return null;
}

export async function hostImageOnCanva(opts: {
  token: string;
  imageBase64: string;
  title: string;
  format?: string;
}): Promise<string | null> {
  const assetId = await uploadPng(opts.token, opts.imageBase64, opts.title);
  if (!assetId) return null;
  const format = opts.format || "feed-portrait";
  const size = canvaSize(format);
  const designId = await createDesign(opts.token, opts.title, format, assetId);
  if (!designId) return null;
  return exportDesignPng({ token: opts.token, designId, width: size.width, height: size.height });
}
