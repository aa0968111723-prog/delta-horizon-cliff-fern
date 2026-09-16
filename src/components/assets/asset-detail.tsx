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
import { ASSET_CATEGORIES, isVideoAsset, kindFromMime, sourceLabel, usageLabel } from "@/lib/studio/assets";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { bytesToBase64 } from "@/lib/studio/bytes";
import { analyzeStudioImage } from "@/lib/ai/image-studio";
import { tagsFromVision } from "@/lib/zen/vision-tags";
import type { AssetCategory, AssetMeta, AssetUsageStatus } from "@/lib/studio/types";
import { AssetMedia } from "@/components/shared/asset-media";
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
  const placeAsset = useStudio((s) => s.placeAsset);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string[] | null>(null);

  if (!asset) return null;
  const current = asset;

  function patch<K extends keyof AssetMeta>(key: K, value: AssetMeta[K]) {
    updateAsset(current.id, { [key]: value });
  }

  function goCreate(idea: string) {
    onOpenChange(false);
    void navigate({
      to: "/create",
      search: { mode: "from-image", idea, asset: current.id },
    });
  }

  async function analyze() {
    setBusy(true);
    try {
      if (isVideoAsset(current)) {
        toast.error("短影音請用「加入創作」延伸，不必拆成單張分析。");
        return;
      }
      let blob = await getAssetStorage().get(current.id);
      if (!blob && current.seedSrc) {
        const res = await fetch(current.seedSrc);
        if (res.ok) blob = await res.blob();
      }
      if (!blob) {
        toast.error("這張圖還沒有檔案可分析。");
        return;
      }
      const buf = await blob.arrayBuffer();
      const b64 = bytesToBase64(new Uint8Array(buf));
      if (b64.length > 1_800_000) {
        toast.error("圖檔太大，請用較小的照片分析。");
        return;
      }
      const result = await analyzeStudioImage({ data: { imageBase64: b64, mime: blob.type || current.mime } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const tags = tagsFromVision(result.analysis, current.tags);
      updateAsset(current.id, { tags, licenseNotes: result.analysis.content.slice(0, 180) });
      setNotes(result.analysis.suggestions);
      toast.success("已寫入 AI 標籤");
    } finally {
      setBusy(false);
    }
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[88dvh] flex-col gap-4 overflow-y-auto">
        <SheetTitle>{asset.name}</SheetTitle>
        <div className="flex gap-3">
          <div className="size-24 overflow-hidden rounded-xl bg-bg">
            {url ? (
              <AssetMedia src={url} video={isVideoAsset(asset)} alt="" className="size-full object-cover" />
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
        <div className="flex flex-wrap gap-2">
          <Button
            data-testid="asset-into-create"
            onClick={() =>
              goCreate(`延續「${current.name}」的風格，做新的活動，不要複製舊作品。`)
            }
          >
            加入創作
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              goCreate(`根據「${current.name}」生成相似視覺，延續風格不要複製。`)
            }
          >
            生成相似視覺
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              goCreate(`根據「${current.name}」寫 IG 文案。先讓淡江學生覺得這在講自己。`)
            }
          >
            生成文案
          </Button>
          <Button
            variant="secondary"
            onClick={() => goCreate(`延伸「${current.name}」做成 Story、Carousel、Reels Cover。`)}
          >
            延伸生成
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void analyze()}>
            {busy ? "分析中…" : "AI 分析／標籤"}
          </Button>
          <Button onClick={place} disabled={!lastProjectId || isVideoAsset(current)} variant="secondary">
            放到目前畫布
          </Button>
        </div>
        {notes?.length ? (
          <ul className="list-disc pl-4 text-sm text-muted">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
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
              updateAsset(asset.id, { category, kind: kindFromMime(asset.mime, category, asset.kind) });
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
            placeholder="例如：淡江禪學社、社員"
          />
        </div>
        <p className="text-xs text-muted">來源與授權只存在此裝置，不會上傳到雲端。</p>
        <div className="flex flex-wrap gap-2 pb-4">
          <Button variant="secondary" onClick={() => toggleFavorite(asset.id)}>
            {asset.favorite ? "取消收藏" : "收藏"}
          </Button>
          <Button variant="secondary" onClick={onDelete}>
            刪除
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
