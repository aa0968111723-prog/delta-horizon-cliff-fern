import { Download, ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoHeroButtons } from "@/components/editor/hero-photo-strip";
import { generateImage, type VisualDirection } from "@/lib/ai/image-ai";
import { previewUrlForAsset } from "@/lib/studio/assets";
import { saveGeneratedImage } from "@/lib/studio/generated-image";
import { LOCAL_VISUAL_NOTE, localVisualNote, localVisualRatioLine, matchLocalVisualAsset, nextLocalVisualAsset } from "@/lib/studio/local-visual";
import { frameAndSaveLocalVisual } from "@/lib/studio/local-visual-frame";
import type { ImageRatio } from "@/lib/studio/wave-draft";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

/** IG 常用尺寸。生成時直接決定構圖比例。 */
const RATIOS = [
  { id: "4:5" as const, label: "IG 4:5" },
  { id: "1:1" as const, label: "IG 1:1" },
  { id: "9:16" as const, label: "Story 9:16" },
  { id: "1.91:1" as const, label: "LINE / 連結" },
];

export function VisualDirectionCard({
  direction,
  onUseCopy,
  onImageSaved,
  styleHint,
  preferredRatio = "4:5",
}: {
  direction: VisualDirection;
  onUseCopy?: (headline: string, subhead: string) => void;
  onImageSaved?: (assetId: string, ratio: ImageRatio) => void;
  styleHint?: string;
  preferredRatio?: (typeof RATIOS)[number]["id"];
}) {
  const addAsset = useStudio((s) => s.addAsset);
  const assets = useStudio((s) => s.assets);
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]["id"]>(preferredRatio);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [seedId, setSeedId] = useState<string | null>(null);
  const [lastAssetId, setLastAssetId] = useState<string | null>(null);
  const [adapter, setAdapter] = useState<"live" | "local" | null>(null);

  useEffect(() => {
    setRatio(preferredRatio);
  }, [preferredRatio]);

  const ratioLabel = RATIOS.find((item) => item.id === ratio)?.label ?? ratio;

  async function applyLocalPhoto(cycle: boolean) {
    const match =
      cycle && seedId
        ? nextLocalVisualAsset(direction, assets, seedId)
        : seedId && !cycle
          ? (assets.find((item) => item.id === seedId) ?? matchLocalVisualAsset(direction, assets))
          : matchLocalVisualAsset(direction, assets);
    const url = match ? previewUrlForAsset(match) : undefined;
    if (!match || !url) {
      toast.error("這個環境沒有連上圖片生成服務。可以先點下面的示範照片。");
      return false;
    }
    setSeedId(match.id);
    try {
      const framed = await frameAndSaveLocalVisual({
        sourceUrl: url,
        name: `${direction.title} · ${ratio}`,
        tags: [direction.title],
        ratio,
      });
      addAsset(framed.meta);
      setPreview(framed.dataUrl);
      setLastAssetId(framed.meta.id);
      setAdapter("local");
      toast.info(localVisualNote(ratioLabel));
      return true;
    } catch {
      setPreview(url);
      setLastAssetId(match.id);
      setAdapter("local");
      toast.info(LOCAL_VISUAL_NOTE);
      return true;
    }
  }

  async function runGenerate() {
    setBusy(true);
    try {
      const res = await generateImage({
        data: { prompt: direction.imagePrompt, ratio, styleHint: styleHint || undefined },
      });
      if (!res.ok) {
        await applyLocalPhoto(Boolean(seedId));
        return;
      }
      setPreview(res.dataUrl);
      const meta = await saveGeneratedImage({
        dataUrl: res.dataUrl,
        name: `${direction.title} · ${ratio}`,
        prompt: res.revisedPrompt || direction.imagePrompt,
        tags: [direction.title, ratio],
      });
      addAsset(meta);
      setLastAssetId(meta.id);
      setAdapter("live");
      onImageSaved?.(meta.id, ratio);
      toast.success("圖片已存進素材庫");
    } catch {
      await applyLocalPhoto(Boolean(seedId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="glass flex h-full flex-col gap-3 rounded-2xl p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg">{direction.title}</p>
            {adapter === "local" ? (
              <Badge data-testid="visual-local-source">本機素材</Badge>
            ) : adapter === "live" ? (
              <Badge variant="accent">AI 生成</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted">{direction.concept}</p>
        </div>
      </header>

      {preview ? (
        <img
          src={preview}
          alt={adapter === "local" ? `${direction.title} 示範照片` : `${direction.title} 生成結果`}
          data-testid="visual-preview"
          data-ratio={ratio}
          className="w-full rounded-xl bg-surface-2 object-cover"
          style={{ aspectRatio: ratio.replace(":", " / ") }}
        />
      ) : null}

      <dl className="space-y-1.5 text-xs">
        <Row label="配色" value={direction.palette} />
        <Row label="構圖" value={direction.composition} />
        <Row label="字體" value={direction.typography} />
      </dl>

      {direction.headline ? (
        <div className="rounded-xl bg-surface-2/60 p-3">
          <p className="text-xs text-muted">主文案</p>
          <p className="mt-1 font-display text-base leading-snug whitespace-pre-line">{direction.headline}</p>
          {direction.subhead ? <p className="mt-1 text-xs text-muted">{direction.subhead}</p> : null}
          {onUseCopy ? (
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => onUseCopy(direction.headline, direction.subhead)}
            >
              套用到畫面
            </Button>
          ) : null}
        </div>
      ) : null}

      <details className="rounded-xl bg-surface-2/40 p-3 text-xs">
        <summary className="cursor-pointer text-muted">圖片 Prompt</summary>
        <p className="mt-2 break-words text-subtle">{direction.imagePrompt}</p>
      </details>

      <div className="mt-auto space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {RATIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRatio(item.id)}
              className={cn(
                "min-h-9 rounded-full px-2.5 text-xs transition-colors",
                ratio === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void runGenerate()} disabled={busy} data-testid="visual-generate">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {preview ? "換一張" : "生成圖片"}
          </Button>
          {preview && onImageSaved ? (
            <Button
              size="sm"
              variant="secondary"
              data-testid="visual-use-hero"
              onClick={() => {
                const id = lastAssetId;
                if (id) onImageSaved(id, ratio);
              }}
              disabled={!lastAssetId}
            >
              用這張當主視覺
            </Button>
          ) : null}
          {preview ? (
            <Button size="sm" variant="ghost" asChild>
              <a href={preview} download={`${direction.title}.png`}>
                <Download className="size-4" />
                下載
              </a>
            </Button>
          ) : null}
        </div>
        {adapter === "local" ? (
          <div className="space-y-1">
            <p className="text-xs text-subtle" data-testid="visual-local-note">
              {localVisualNote(ratioLabel)}
            </p>
            <p className="text-xs text-subtle" data-testid="visual-local-ratio">
              {localVisualRatioLine(ratioLabel)}
            </p>
          </div>
        ) : null}
        {onImageSaved ? (
          <div className="space-y-1.5">
            <p className="text-xs text-subtle">沒有生圖服務時，生成會先套對應的示範照片。點照片也能當主視覺。</p>
            <PhotoHeroButtons
              testIdPrefix="hero-card"
              onPick={(assetId) => {
                const asset = assets.find((item) => item.id === assetId);
                const url = asset ? previewUrlForAsset(asset) : undefined;
                if (url) setPreview(url);
                setLastAssetId(assetId);
                setAdapter("local");
                onImageSaved(assetId, ratio);
              }}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="w-10 shrink-0 text-subtle">{label}</dt>
      <dd className="min-w-0 text-muted">{value}</dd>
    </div>
  );
}

export function DirectionSourceNote({ adapter }: { adapter: "live" | "local" }) {
  return (
    <Badge variant={adapter === "live" ? "accent" : "default"}>
      {adapter === "live" ? "AI 生成方向" : "本機方向草稿"}
    </Badge>
  );
}

export function RegenerateButton({ onClick, busy }: { onClick: () => void; busy?: boolean }) {
  return (
    <Button variant="secondary" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      重新想方向
    </Button>
  );
}
