import { useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageRevisionBar } from "@/components/create/image-revision";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { analyzeImage, generateImage } from "@/lib/ai/image-ai";
import { formatBrandMemory } from "@/lib/studio/brand";
import { useIgDnaText, useIgInsightsText } from "@/hooks/use-ig-dna";
import { ASSET_CATEGORIES, kindFromCategory, similarAssets, sourceLabel, usageLabel } from "@/lib/studio/assets";
import { saveGeneratedImage, urlToDataUrl } from "@/lib/studio/generated-image";
import type { AssetCategory, AssetMeta, AssetUsageStatus } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export function AssetDetailSheet({
  asset,
  url,
  usage,
  open,
  onOpenChange,
  onDelete,
}: {
  asset: AssetMeta | null;
  url?: string;
  usage: AssetUsageStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const updateAsset = useStudio((s) => s.updateAsset);
  const addAsset = useStudio((s) => s.addAsset);
  const placeAsset = useStudio((s) => s.placeAsset);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);
  const assets = useStudio((s) => s.assets);
  const brand = useStudio((s) => s.brands[0]);
  const igDnaText = useIgDnaText();
  const insightsText = useIgInsightsText();
  const [busy, setBusy] = useState<"analyze" | "extend" | null>(null);

  const similar = useMemo(
    () => (asset ? similarAssets(asset, assets, 4) : []),
    [asset, assets],
  );

  if (!asset) return null;
  const current = asset;
  const preview = url || current.seedSrc;

  function patch<K extends keyof AssetMeta>(key: K, value: AssetMeta[K]) {
    updateAsset(current.id, { [key]: value });
  }

  function place() {
    if (!lastProjectId) {
      toast.error("還沒有開啟的專案，請先到編輯器。");
      return;
    }
    const ok = placeAsset(lastProjectId, current.id);
    if (!ok) {
      toast.error("無法放到畫布");
      return;
    }
    toast.success(`已放入「${current.name}」`);
    onOpenChange(false);
    void navigate({ to: "/studio/$projectId", params: { projectId: lastProjectId } });
  }

  async function analyze() {
    if (!preview) {
      toast.error("這張圖還沒載入，稍後再試。");
      return;
    }
    setBusy("analyze");
    try {
      const imageUrl = await urlToDataUrl(preview);
      const res = await analyzeImage({
        data: {
          imageUrl,
          question: "這張圖適不適合禪學社網宣？可以怎麼延續？",
          brandMemoryText: brand ? formatBrandMemory(brand.memory) : undefined,
          igDnaText: igDnaText || undefined,
          insightsText: insightsText || undefined,
        },
      });
      if (!res.ok) {
        toast.warning(res.error);
        return;
      }
      updateAsset(current.id, {
        insight: {
          summary: res.analysis.summary,
          stylePrompt: res.analysis.stylePrompt,
          captionIdea: res.analysis.captionIdea,
          tooReligious: res.analysis.tooReligious,
          tooAi: res.analysis.tooAi,
          fitsTku: res.analysis.fitsTku,
          nextSteps: res.analysis.nextSteps,
          analyzedAt: Date.now(),
        },
      });
      toast.success("已讀完這張圖");
    } catch {
      toast.error("讀圖時出錯了。");
    } finally {
      setBusy(null);
    }
  }

  async function extendStyle() {
    const prompt = current.insight?.stylePrompt;
    if (!prompt) {
      toast.error("先按「讀這張圖」，才有風格可以延續。");
      return;
    }
    setBusy("extend");
    try {
      const res = await generateImage({
        data: {
          prompt,
          ratio: "4:5",
          styleHint: brand
            ? `${brand.imageStyle.mood}｜${brand.imageStyle.lighting}｜${brand.imageStyle.composition}`
            : undefined,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const meta = await saveGeneratedImage({
        dataUrl: res.dataUrl,
        name: `${current.name} 延續`,
        prompt: res.revisedPrompt || prompt,
        tags: ["延續風格", current.name],
      });
      addAsset(meta);
      toast.success("延續圖已存進素材庫");
    } catch {
      toast.error("生成時出錯了。");
    } finally {
      setBusy(null);
    }
  }

  async function useCaption() {
    const idea = current.insight?.captionIdea;
    if (!idea) {
      toast.error("先讀這張圖，才有文案可以帶走。");
      return;
    }
    try {
      await navigator.clipboard.writeText(idea);
      toast.success("已複製文案想法");
    } catch {
      toast.error("複製失敗");
    }
    void navigate({ to: "/create", search: { from: "image", seed: idea } });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[88dvh] flex-col gap-4 overflow-y-auto">
        <SheetTitle>{asset.name}</SheetTitle>
        <div className="flex gap-3">
          <div className="size-24 overflow-hidden rounded-xl bg-bg">
            {preview ? (
              <img src={preview} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted">無預覽</div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-xs text-muted">
            <p>
              {asset.width}×{asset.height} · {asset.mime}
            </p>
            <p className="mt-1">來源：{sourceLabel(asset.source)}</p>
            <p className="mt-1">狀態：{usageLabel(usage)}</p>
            <p className="mt-1">使用 {asset.useCount} 次</p>
            {asset.lastUsedAt ? (
              <p className="mt-1">最近 {new Date(asset.lastUsedAt).toLocaleString("zh-TW")}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-2/70 p-3">
          <p className="text-sm font-medium">AI 怎麼用這張</p>
          {asset.insight ? (
            <div className="mt-2 space-y-1.5 text-xs text-muted">
              <p>{asset.insight.summary}</p>
              {asset.insight.captionIdea ? <p>文案想法：{asset.insight.captionIdea}</p> : null}
              <p>
                {asset.insight.fitsTku ? "看起來像淡江學生的生活。" : "不太像淡江學生會停下來的畫面。"}
                {asset.insight.tooReligious ? " 偏宗教。" : ""}
                {asset.insight.tooAi ? " 有 AI 感。" : ""}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">還沒讀過。讀完之後可以延續風格、寫文案，或找相近的素材。</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void analyze()} disabled={busy !== null}>
              {busy === "analyze" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              讀這張圖
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void extendStyle()} disabled={busy !== null}>
              {busy === "extend" ? <Loader2 className="size-4 animate-spin" /> : null}
              延續這個風格
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onOpenChange(false);
                void navigate({ to: "/create", search: { from: "image", asset: current.id } });
              }}
            >
              用這張創作
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void useCaption()}>
              用這張寫文案
            </Button>
          </div>
        </div>

        {preview ? (
          <div className="rounded-2xl bg-surface-2/70 p-3">
            <ImageRevisionBar imageUrl={preview} sourceLabel={asset.name} />
          </div>
        ) : null}

        {similar.length ? (
          <div>
            <p className="mb-2 text-sm font-medium">相近素材</p>
            <ul className="flex flex-wrap gap-1.5">
              {similar.map((item) => (
                <li key={item.id} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <Label className="mb-1.5 block">名稱</Label>
          <Input value={asset.name} onChange={(e) => patch("name", e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block">分類</Label>
          <Select
            value={asset.category}
            onValueChange={(v) => {
              const category = v as AssetCategory;
              updateAsset(asset.id, { category, kind: kindFromCategory(category) });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CATEGORIES.filter((item) => !item.virtual).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">標籤（逗號分隔）</Label>
          <Input
            value={asset.tags.join("，")}
            onChange={(e) =>
              patch(
                "tags",
                e.target.value
                  .split(/[,，]/)
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
        <div>
          <Label className="mb-1.5 block">授權備註</Label>
          <Textarea
            value={asset.licenseNotes}
            onChange={(e) => patch("licenseNotes", e.target.value)}
            placeholder="拍攝者、授權範圍、可否商用"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">權利人／來源</Label>
          <Input
            value={asset.licenseOwner}
            onChange={(e) => patch("licenseOwner", e.target.value)}
            placeholder="例如：淡江大學禪學社、拍攝的社員"
          />
        </div>
        <p className="text-xs text-muted">來源與授權只存在此裝置，不會上傳到雲端。</p>
        <div className="flex flex-wrap gap-2 pb-4">
          <Button onClick={place} disabled={!lastProjectId}>
            放到目前畫布
          </Button>
          <Button variant="secondary" onClick={() => toggleFavorite(asset.id)}>
            {asset.favorite ? "取消收藏" : "收藏"}
          </Button>
          <Button variant="outline" onClick={onDelete}>
            刪除
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
