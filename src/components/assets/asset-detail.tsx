import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
import { analyzeCreativeAsset, generateZenCreativeWave } from "@/lib/ai/zen-creative";
import { applyCreativeToStudio } from "@/lib/studio/apply-creative";
import { ASSET_CATEGORIES, sourceLabel, usageLabel } from "@/lib/studio/assets";
import { kindFromCategory } from "@/lib/studio/assets";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import type { AssetCategory, AssetMeta, AssetUsageStatus } from "@/lib/studio/types";
import { buildLocalCreativeWave } from "@/lib/studio/zen-prompt-engine";
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
  const addCreativeSource = useCampaignStore((s) => s.addCreativeSource);
  const [analyzing, setAnalyzing] = useState(false);
  const [similarBusy, setSimilarBusy] = useState(false);

  if (!asset) return null;
  const current = asset;

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
    setAnalyzing(true);
    try {
      const result = await analyzeCreativeAsset({
        data: { name: current.name, category: current.category, tags: current.tags },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const extraTags = result.analysis.detectedElements.slice(0, 6);
      updateAsset(current.id, {
        analysisNotes: result.analysis.contentSummary,
        tags: [...new Set([...current.tags, ...extraTags])],
        attribution: current.attribution || current.licenseOwner || "素材庫",
      });
      toast.success(result.adapter === "live" ? "已用 Grok 看過這張圖" : "已完成本機視覺分析");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "分析失敗");
    } finally {
      setAnalyzing(false);
    }
  }

  async function generateSimilar() {
    const topic = `延續「${current.name}」的光線與留白`;
    const details = current.analysisNotes || current.tags.join("、");
    setSimilarBusy(true);
    try {
      const result = await generateZenCreativeWave({ data: { topic, details } });
      const wave = result.ok
        ? result.wave
        : buildLocalCreativeWave({ topic, details });
      if (!result.ok) toast.message("改用本機草案繼續");
      addCreativeSource({
        source: "ai-generated",
        title: `相似視覺 · ${current.name}`,
        subtitle: current.attribution || current.licenseOwner || "素材庫延伸",
        thumbnailUrl: current.seedSrc || "/seed/cup.jpg",
        category: "AI 生成",
        tags: ["相似", ...current.tags.slice(0, 4)],
        date: new Date().toISOString().slice(0, 10),
        meta: { fromAssetId: current.id, imagePrompt: wave.directions[0].imagePrompt },
      });
      const { projectId } = applyCreativeToStudio({
        topic: `延續素材「${current.name}」`,
        direction: wave.directions[0],
        conversion: wave.conversion,
        source: result.ok ? result.adapter : "mock",
        schedule: false,
      });
      onOpenChange(false);
      toast.success(result.ok && result.adapter === "live" ? "已用 Grok 生成同風格並套上畫布" : "已生成同風格方向並套上畫布");
      void navigate({ to: "/studio/$projectId", params: { projectId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失敗");
    } finally {
      setSimilarBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[88dvh] flex-col gap-4 overflow-y-auto">
        <SheetTitle>{asset.name}</SheetTitle>
        <div className="flex gap-3">
          <div className="size-24 overflow-hidden rounded-xl bg-bg">
            {url ? (
              <img src={url} alt="" className="size-full object-cover" />
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
            placeholder="例如：淡江禪學社、茶會紀錄"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">出處標註</Label>
          <Input
            value={asset.attribution ?? ""}
            onChange={(e) => patch("attribution", e.target.value)}
            placeholder="Google Drive／2025 茶會、Canva 母模板、實拍"
          />
        </div>
        {asset.analysisNotes ? (
          <p className="rounded-lg bg-surface-2 p-2.5 text-xs text-muted">{asset.analysisNotes}</p>
        ) : null}
        <p className="text-xs text-muted">來源與授權只存在此裝置，不會上傳到雲端。</p>
        <div className="flex flex-wrap gap-2 pb-4">
          <Button onClick={place} disabled={!lastProjectId}>
            放到目前畫布
          </Button>
          <Button variant="secondary" data-testid="analyze-asset" disabled={analyzing} onClick={() => void analyze()}>
            {analyzing ? "分析中…" : "分析圖片"}
          </Button>
          <Button variant="outline" data-testid="generate-similar" disabled={similarBusy} onClick={() => void generateSimilar()}>
            {similarBusy ? "生成中…" : "生成相似並套用"}
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
