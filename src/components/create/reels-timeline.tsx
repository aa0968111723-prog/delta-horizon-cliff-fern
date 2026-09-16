import { Check, Copy as CopyIcon, ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateImage } from "@/lib/ai/image-ai";
import { previewUrlForAsset } from "@/lib/studio/assets";
import { saveGeneratedImage } from "@/lib/studio/generated-image";
import { LOCAL_VISUAL_NOTE, matchLocalVisualAsset } from "@/lib/studio/local-visual";
import { coverImagePrompt, reelsScriptText, shotListText } from "@/lib/studio/reels-cover";
import type { ReelsScript } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export { reelsScriptText };

export function ReelsTimeline({
  reels,
  adapter,
  projectId,
}: {
  reels: ReelsScript;
  adapter?: "live" | "local" | "mock";
  projectId?: string;
}) {
  const addAsset = useStudio((s) => s.addAsset);
  const assets = useStudio((s) => s.assets);
  const applyVisualToPack = useStudio((s) => s.applyVisualToPack);
  const applyCoverAsset = useStudio((s) => s.applyCoverAsset);
  const brand = useStudio((s) => s.brands[0]);
  const [copied, setCopied] = useState<"script" | "shots" | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [coverAdapter, setCoverAdapter] = useState<"live" | "local" | null>(null);

  function applyLocalCover() {
    const match = matchLocalVisualAsset({ hook: reels.hook, imagePrompt: reels.cover }, assets);
    const url = match ? previewUrlForAsset(match) : undefined;
    if (!match || !url) return false;
    setPreview(url);
    setCoverAdapter("local");
    if (projectId) {
      const count = applyVisualToPack(projectId, match.id);
      if (count < 1) applyCoverAsset(projectId, match.id);
    }
    toast.info(LOCAL_VISUAL_NOTE);
    return true;
  }

  async function copyText(kind: "script" | "shots", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("複製失敗，請再試一次。");
    }
  }

  async function generateCover() {
    setCoverBusy(true);
    try {
      const prompt = coverImagePrompt(reels);
      const res = await generateImage({
        data: {
          prompt,
          ratio: "9:16",
          styleHint: brand
            ? `${brand.imageStyle.mood}｜${brand.imageStyle.lighting}｜${brand.imageStyle.composition}`
            : undefined,
        },
      });
      if (!res.ok) {
        if (!applyLocalCover()) toast.error(res.error);
        return;
      }
      setPreview(res.dataUrl);
      setCoverAdapter("live");
      const meta = await saveGeneratedImage({
        dataUrl: res.dataUrl,
        name: `Reels 封面 · ${reels.hook.slice(0, 18)}`,
        prompt: res.revisedPrompt || prompt,
        tags: ["Reels 封面", "9:16"],
      });
      addAsset(meta);
      if (projectId) {
        const count = applyVisualToPack(projectId, meta.id);
        if (count < 1) applyCoverAsset(projectId, meta.id);
        toast.success(
          count > 1
            ? "封面已套到全套畫面，限動、LINE 也換了。"
            : "封面已套到畫面，也存進素材庫",
        );
      } else {
        toast.success("封面已存進素材庫。先用一版文案建立內容，就能套到畫面上。");
      }
    } catch {
      if (!applyLocalCover()) toast.error("生成封面時出錯了，再試一次。");
    } finally {
      setCoverBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-lg leading-snug">{reels.hook}</p>
          <p className="mt-1 text-xs text-muted">封面：{reels.cover}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => void copyText("script", reelsScriptText(reels))}>
            {copied === "script" ? <Check className="size-4" /> : <CopyIcon className="size-4" />}
            {copied === "script" ? "已複製腳本" : "複製整支腳本"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void copyText("shots", shotListText(reels))}>
            {copied === "shots" ? <Check className="size-4" /> : <CopyIcon className="size-4" />}
            {copied === "shots" ? "已複製清單" : "複製拍攝清單"}
          </Button>
          <Button size="sm" onClick={() => void generateCover()} disabled={coverBusy}>
            {coverBusy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {preview || reels.coverAssetId ? "換一張封面" : "生成封面圖"}
          </Button>
        </div>
      </div>
      {coverAdapter === "local" ? (
        <p className="text-xs text-subtle">
          <Badge className="mr-2">本機素材</Badge>
          {LOCAL_VISUAL_NOTE}
        </p>
      ) : null}
      {adapter === "local" || adapter === "mock" ? (
        <p className="text-xs text-subtle">這是本機草稿，可以直接改；不是線上模型的回覆。</p>
      ) : null}
      {preview ? (
        <img
          src={preview}
          alt="Reels 封面"
          className="mx-auto max-h-80 w-auto rounded-xl bg-surface-2 object-cover"
        />
      ) : null}
      <ol className="relative space-y-2 border-l border-border pl-4">
        {reels.beats.map((beat) => (
          <li key={beat.range} className="relative rounded-2xl glass p-4">
            <span className="absolute -left-[21px] top-5 size-2.5 rounded-full bg-accent" />
            <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">{beat.range}</p>
            <p className="mt-1 text-sm font-medium">{beat.caption}</p>
            <dl className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
              <div>
                <dt className="text-subtle">畫面</dt>
                <dd>{beat.visual}</dd>
              </div>
              <div>
                <dt className="text-subtle">旁白</dt>
                <dd>{beat.voice}</dd>
              </div>
              <div>
                <dt className="text-subtle">轉場</dt>
                <dd>{beat.transition}</dd>
              </div>
              <div>
                <dt className="text-subtle">素材</dt>
                <dd>{beat.asset}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
