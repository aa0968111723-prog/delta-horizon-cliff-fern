import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { pollImagineVideo, startImagineVideo, hasXaiKey } from "@/lib/ai/xai";
import { httpsRasterUrl, httpsVideoUrl } from "@/lib/club/last-pack";

const Input = z.object({
  prompt: z.string().min(8).max(800),
  imageUrl: z.string().max(2000).optional(),
  requestId: z.string().max(120).optional(),
  duration: z.number().min(5).max(12).optional(),
});

async function waitForVideo(requestId: string, budgetMs = 18_000) {
  const started = Date.now();
  let wait = 2500;
  while (Date.now() - started < budgetMs) {
    const polled = await pollImagineVideo(requestId);
    if (!polled.ok) return polled;
    if (polled.status === "done" && polled.url) return polled;
    await new Promise((resolve) => setTimeout(resolve, wait));
    wait = Math.min(wait + 500, 4000);
  }
  return { ok: true as const, status: "pending" as const, requestId };
}

export const generateReelsClip = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }) => {
    if (!hasXaiKey()) {
      return { ok: false as const, error: "目前沒有連到影片生成。可先用封面與腳本排程。" };
    }
    if (data.requestId) {
      const polled = await waitForVideo(data.requestId);
      if (!polled.ok) return polled;
      if (polled.status === "done" && "url" in polled && polled.url) {
        return { ok: true as const, url: httpsVideoUrl(polled.url) || polled.url, requestId: data.requestId };
      }
      return { ok: true as const, pending: true as const, requestId: data.requestId };
    }
    const imageUrl = httpsRasterUrl(data.imageUrl);
    if (!imageUrl) {
      return { ok: false as const, error: "生成 Reels 影片需要公開封面 JPG（Canva 匯出或 Imagine）。" };
    }
    const started = await startImagineVideo({
      prompt: data.prompt,
      imageUrl,
      duration: data.duration ?? 10,
    });
    if (!started.ok) return started;
    const polled = await waitForVideo(started.requestId);
    if (!polled.ok) return polled;
    if (polled.status === "done" && "url" in polled && polled.url) {
      return { ok: true as const, url: httpsVideoUrl(polled.url) || polled.url, requestId: started.requestId };
    }
    return { ok: true as const, pending: true as const, requestId: started.requestId };
  });
