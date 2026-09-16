import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  INGEST_MAX_BYTES,
  isAllowedIngestUrl,
  isRasterImageMime,
} from "@/lib/zen/ingest";

function unwrap(input: unknown) {
  return input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
    ? (input as { data: unknown }).data
    : input;
}

const FetchInput = z.object({
  url: z.string().url().max(2000),
});

export type IngestImageResult =
  | { ok: true; mime: string; b64: string }
  | { ok: false; error: string };

export async function fetchAllowlistedImageBytes(url: string): Promise<IngestImageResult> {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    if (!isAllowedIngestUrl(current)) {
      return { ok: false, error: "這個網址不在允許的素材來源裡。" };
    }
    const res = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: "image/jpeg,image/png,image/webp,image/gif,image/*;q=0.8" },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return { ok: false, error: "素材轉址失敗。" };
      current = new URL(location, current).toString();
      continue;
    }
    if (!res.ok) return { ok: false, error: `素材讀不到（${res.status}）。` };
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
    if (!isRasterImageMime(mime)) {
      return { ok: false, error: "這不是可放入素材庫的圖片。" };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > INGEST_MAX_BYTES) {
      return { ok: false, error: "圖片太大，沒有放進素材庫。" };
    }
    return { ok: true, mime, b64: buf.toString("base64") };
  }
  return { ok: false, error: "素材轉址太多次。" };
}

export const fetchAllowlistedImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => FetchInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<IngestImageResult> => fetchAllowlistedImageBytes(data.url));
