import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { editImage } from "@/lib/ai/image-ai";
import { REVISION_PRESETS } from "@/lib/ai/imagine-request";
import { saveDataUrlAsAsset, saveGeneratedImage, urlToDataUrl } from "@/lib/studio/generated-image";
import { LOCAL_REVISE_NOTE, reviseImageLocal } from "@/lib/studio/image-revise-local";
import type { AssetMeta } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

const RATIOS = [
  { id: "4:5" as const, label: "4:5" },
  { id: "1:1" as const, label: "1:1" },
  { id: "9:16" as const, label: "9:16" },
];

/**
 * 圖片改版：用自然語言改現有圖。沒有金鑰就誠實說，不拿假圖充數。
 */
export function ImageRevisionBar({
  imageUrl,
  ratio: initialRatio = "4:5",
  sourceLabel = "改版",
  onSaved,
}: {
  imageUrl: string;
  ratio?: "4:5" | "1:1" | "9:16" | "1.91:1";
  sourceLabel?: string;
  onSaved?: (meta: AssetMeta, dataUrl: string) => void;
}) {
  const addAsset = useStudio((s) => s.addAsset);
  const [presetId, setPresetId] = useState(REVISION_PRESETS[0]?.id ?? "tku-life");
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]["id"]>(
    initialRatio === "1.91:1" ? "4:5" : initialRatio,
  );
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [adapter, setAdapter] = useState<"live" | "local" | null>(null);

  async function run() {
    const preset = REVISION_PRESETS.find((item) => item.id === presetId);
    const instruction = custom.trim() || preset?.instruction || "";
    if (!instruction) {
      toast.error("先選一種改法，或寫一句想怎麼改。");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await urlToDataUrl(imageUrl);
      if (dataUrl.length > 3_800_000) {
        toast.error("這張圖太大，改版前先換成較小的圖。");
        return;
      }
      const res = await editImage({
        data: { imageUrl: dataUrl, instruction, ratio },
      });
      if (res.ok) {
        const meta = await saveGeneratedImage({
          dataUrl: res.dataUrl,
          name: `${sourceLabel} · ${preset?.label ?? "改版"}`,
          prompt: res.revisedPrompt || instruction,
          tags: ["改版", preset?.label ?? "改版"],
        });
        addAsset(meta);
        setAdapter("live");
        onSaved?.(meta, res.dataUrl);
        toast.success("改版已存進素材庫");
        return;
      }
      const local = await reviseImageLocal({
        imageUrl: dataUrl,
        presetId,
        ratio,
      });
      const meta = await saveDataUrlAsAsset({
        dataUrl: local.dataUrl,
        name: `${sourceLabel} · ${preset?.label ?? "改版"}`,
        tags: ["本機改版", preset?.label ?? "改版", ratio],
        source: "upload",
        notes: LOCAL_REVISE_NOTE,
      });
      addAsset(meta);
      setAdapter("local");
      onSaved?.(meta, local.dataUrl);
      toast.info(LOCAL_REVISE_NOTE);
    } catch {
      toast.error("改圖時出錯了，再試一次。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted">改這張圖</p>
        {adapter === "local" ? (
          <Badge data-testid="revision-source">本機改版</Badge>
        ) : adapter === "live" ? (
          <Badge variant="accent" data-testid="revision-source">
            AI 改圖
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-subtle">沒有線上改圖時，會換成選定比例並留白給標題。不會改畫面裡的東西。</p>
      <div className="flex flex-wrap gap-1.5">
        {REVISION_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setPresetId(item.id);
              if (item.id === "story-space") setRatio("9:16");
            }}
            className={cn(
              "min-h-9 rounded-full px-3 text-xs transition-colors",
              presetId === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {RATIOS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRatio(item.id)}
            className={cn(
              "min-h-9 rounded-full px-3 text-xs transition-colors",
              ratio === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="或自己寫：例如改成宿舍窗邊、中間留白給標題"
      />
      <Button size="sm" onClick={() => void run()} disabled={busy || !imageUrl}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
        改這張圖
      </Button>
    </div>
  );
}
