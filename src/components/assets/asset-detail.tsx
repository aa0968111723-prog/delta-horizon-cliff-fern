import { useNavigate } from "@tanstack/react-router";
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
import { ASSET_CATEGORIES, sourceLabel, usageLabel } from "@/lib/studio/assets";
import { kindFromCategory } from "@/lib/studio/assets";
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
  const placeAsset = useStudio((s) => s.placeAsset);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);

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
            placeholder="例如：淡江禪學社、社員姓名"
          />
        </div>
        <p className="text-xs text-muted">來源與授權只存在此裝置，不會上傳到雲端。</p>
        <div className="flex flex-wrap gap-2 pb-4">
          <Button onClick={place} disabled={!lastProjectId}>
            放到目前畫布
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!url) {
                toast.error("還沒有預覽可以分析。");
                return;
              }
              try {
                const dataUrl = url.startsWith("data:") ? url : await blobToDataUrl(url);
                const { analyzeStudioImage } = await import("@/lib/ai/image");
                const result = await analyzeStudioImage({
                  data: { imageDataUrl: dataUrl, question: "幫這張素材打標，看適不適合淡江學生 IG。" },
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                const tags = Array.from(
                  new Set([
                    ...current.tags,
                    ...[result.analysis.color, result.analysis.brand, result.analysis.student]
                      .join(" ")
                      .split(/[、，,\s]+/)
                      .map((t) => t.trim())
                      .filter((t) => t.length >= 2 && t.length <= 12)
                      .slice(0, 6),
                  ]),
                );
                updateAsset(current.id, {
                  tags,
                  licenseNotes: [current.licenseNotes, result.analysis.content, `太宗教？${result.analysis.tooReligious}`, `太 AI？${result.analysis.tooAi}`]
                    .filter(Boolean)
                    .join("\n"),
                });
                toast.success("已寫入 AI 標籤");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "分析失敗");
              }
            }}
          >
            AI 分析／打標
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void navigate({ to: "/create/image" });
            }}
          >
            延伸生成
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

async function blobToDataUrl(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("讀取失敗"));
    reader.readAsDataURL(blob);
  });
}
