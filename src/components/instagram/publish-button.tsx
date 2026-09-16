import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publishOrQueueInstagram } from "@/lib/ai/oauth";

export function PublishIgButton({
  caption,
  onPublished,
}: {
  caption: string;
  onPublished?: () => void;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    const text = caption.trim();
    if (!text) {
      toast.message("還沒有文案可以發。");
      return;
    }
    setBusy(true);
    try {
      const result = await publishOrQueueInstagram({
        data: { caption: text, imageUrl: imageUrl.trim() || undefined },
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
      if (result.needsReauth) {
        toast.message("需要時到「連接」重新授權 Instagram。");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        className="min-w-0"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="公開圖片網址（官方發布用）"
        aria-label="公開圖片網址"
      />
      <Button size="sm" variant="secondary" disabled={busy || !caption.trim()} onClick={() => void run()}>
        {busy ? "發布中…" : "發布到 IG"}
      </Button>
    </div>
  );
}
