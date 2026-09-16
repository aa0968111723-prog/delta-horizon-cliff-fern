import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publishOrQueueInstagram } from "@/lib/ai/oauth";
import { isPublicHttpsUrl } from "@/lib/zen/ingest";
import { rasterJpegFromSrc } from "@/lib/zen/raster-client";

export function PublishIgButton({
  caption,
  imageSrc,
  onPublished,
}: {
  caption: string;
  imageSrc?: string | null;
  onPublished?: () => void;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [fallback, setFallback] = useState(false);

  async function run() {
    const text = caption.trim();
    if (!text) {
      toast.message("還沒有文案可以發。");
      return;
    }
    setBusy(true);
    try {
      const raster = imageSrc ? await rasterJpegFromSrc(imageSrc) : null;
      const publicSrc = imageSrc && isPublicHttpsUrl(imageSrc) ? imageSrc : "";
      const result = await publishOrQueueInstagram({
        data: {
          caption: text,
          imageUrl: imageUrl.trim() || publicSrc || undefined,
          imageB64: raster?.b64,
          mime: raster?.mime,
        },
      });
      if (result.ok) {
        toast.success("已用官方 API 發到 IG");
        onPublished?.();
        return;
      }
      try {
        await navigator.clipboard.writeText(result.caption);
      } catch {
        /* clipboard optional */
      }
      toast.message(result.error);
      if (result.needsPublicUrl) setFallback(true);
      if (result.needsReauth) {
        toast.message("需要時到「連接」重新授權 Instagram。");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto">
      <Button
        size="sm"
        variant="secondary"
        data-testid="ig-publish-now"
        disabled={busy || !caption.trim()}
        onClick={() => void run()}
      >
        {busy ? "發布中…" : imageSrc ? "用目前畫面發到 IG" : "發布到 IG"}
      </Button>
      {fallback ? (
        <Input
          className="min-w-0"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="沒有畫面時可貼公開 https 圖片"
          aria-label="公開圖片網址"
        />
      ) : null}
    </div>
  );
}
