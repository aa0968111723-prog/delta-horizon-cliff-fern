import { useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canImportRemote } from "@/lib/connections/media";
import type { RemoteItem } from "@/lib/connections/remote";
import { bringRemoteIntoLibrary } from "@/lib/studio/bring-remote";
import { useStudio } from "@/stores/studio-store";

export function BringRemoteButton({ item }: { item: RemoteItem }) {
  const navigate = useNavigate();
  const addAsset = useStudio((s) => s.addAsset);
  const [busy, setBusy] = useState(false);
  if (!canImportRemote(item.kind)) return null;

  async function run() {
    setBusy(true);
    try {
      const res = await bringRemoteIntoLibrary(item);
      if (!res.ok) {
        toast.warning(res.error);
        return;
      }
      addAsset(res.asset);
      toast.success("已帶進素材庫，可以開始創作");
      void navigate({ to: "/create", search: { from: "image", asset: res.asset.id } });
    } catch {
      toast.error("帶進創作時出錯了，再試一次。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label={`用這張創作 ${item.title}`}
      disabled={busy}
      onClick={() => void run()}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      用這張創作
    </Button>
  );
}
