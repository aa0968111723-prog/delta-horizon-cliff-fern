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
  const [open, setOpen] = useState(false);

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

  if (!open) {
    return (
      <Button size="sm" variant="secondary" disabled={!caption.trim()} onClick={() => setOpen(true)}>
        發布到 IG
      </Button>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <Input
        className="min-w-0"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="公開圖片網址（沒有也可先複製文案）"
        aria-label="公開圖片網址"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy || !caption.trim()} onClick={() => void run()}>
          {busy ? "發布中…" : imageUrl.trim() ? "用官方 API 發" : "複製文案"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          取消
        </Button>
      </div>
    </div>
  );
}
