import { BrainCircuit, WandSparkles } from "lucide-react";
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
import { analyzeCreativeImage, editCreativeImage } from "@/lib/ai/multimodal";
import { base64ImageToBlob, prepareImageForAi, sourceBlob } from "@/lib/studio/ai-image-client";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { ASSET_CATEGORIES, sourceLabel, usageLabel } from "@/lib/studio/assets";
import { kindFromCategory } from "@/lib/studio/assets";
import { uid } from "@/lib/studio/ids";
import type { AssetCategory, AssetMeta, AssetUsageStatus } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export function AssetDetailSheet({
  asset,
  url,
  usage,
  open,
  onOpenChange,
  onDelete,
  onCreated,
}: {
  asset: AssetMeta | null;
  url?: string;
  usage: AssetUsageStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onCreated?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const updateAsset = useStudio((s) => s.updateAsset);
  const addAsset = useStudio((s) => s.addAsset);
  const placeAsset = useStudio((s) => s.placeAsset);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);
  const [aiBusy, setAiBusy] = useState<"analyze" | "edit" | null>(null);
  const [editInstruction, setEditInstruction] = useState("延伸成有夜晚校園感的 IG 主視覺，保留人物與自然互動，增加標題留白");
  const [editRatio, setEditRatio] = useState<"4:5" | "1:1" | "9:16">("4:5");

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

  async function preparedSource() {
    const blob = await sourceBlob(current.id, url);
    return prepareImageForAi(blob);
  }

  async function analyze() {
    setAiBusy("analyze");
    try {
      const prepared = await preparedSource();
      const result = await analyzeCreativeImage({ data: { dataUrl: prepared.dataUrl } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      updateAsset(current.id, {
        analysis: result.analysis,
        tags: [...new Set([...current.tags, ...result.analysis.suggestedTags])].slice(0, 20),
      });
      toast.success("已完成淡江學生視角分析與 AI Tag");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "圖片分析失敗");
    } finally {
      setAiBusy(null);
    }
  }

  async function edit() {
    if (editInstruction.trim().length < 3) {
      toast.error("先描述想怎麼延伸這張素材");
      return;
    }
    setAiBusy("edit");
    try {
      const prepared = await preparedSource();
      const result = await editCreativeImage({
        data: { dataUrl: prepared.dataUrl, instruction: editInstruction, aspectRatio: editRatio },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const raw = await base64ImageToBlob(result.image.base64, result.image.mime);
      const generated = await prepareImageForAi(raw);
      const id = uid("asset_ai_edit");
      await getAssetStorage().put(id, generated.blob);
      addAsset({
        id,
        name: `${current.name}｜AI 延伸`,
        kind: "image",
        category: current.category,
        mime: generated.mime,
        width: generated.width,
        height: generated.height,
        tags: [...new Set([...current.tags, "AI 延伸", editRatio])].slice(0, 20),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "generated",
        licenseNotes: `由 xAI Grok Imagine 參考「${current.name}」生成；原始來源與人物授權仍需一併確認。`,
        licenseOwner: current.licenseOwner,
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
        generationPrompt: editInstruction,
        provenance: {
          provider: "generated",
          label: `AI 延伸自 ${current.name}`,
          parentAssetId: current.id,
          importedAt: Date.now(),
        },
      });
      toast.success("延伸視覺已加入 Creative Library");
      onCreated?.(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "圖片改版失敗");
    } finally {
      setAiBusy(null);
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
            {asset.provenance ? (
              <p className="mt-1">
                {asset.provenance.label}
                {asset.provenance.collection ? `／${asset.provenance.collection}` : ""}
                {asset.provenance.sourceDate ? `／${asset.provenance.sourceDate}` : ""}
              </p>
            ) : null}
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
        <section className="rounded-2xl bg-surface-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <BrainCircuit className="size-4 text-accent" />
                AI 視覺理解
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">從淡江學生、品牌與 IG 手機停留感檢查，不會在開啟素材時自動花費額度。</p>
            </div>
            <Button size="sm" variant="secondary" disabled={Boolean(aiBusy)} onClick={() => void analyze()}>
              {aiBusy === "analyze" ? "分析中…" : current.analysis ? "重新分析" : "AI 分析"}
            </Button>
          </div>
          {current.analysis ? (
            <div className="mt-4 space-y-3 text-xs leading-5">
              <p className="text-sm text-fg">{current.analysis.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <AnalysisFact label="淡江學生感" value={current.analysis.studentFit} />
                <AnalysisFact label="IG 停留感" value={current.analysis.stopPower} />
                <AnalysisFact label="構圖" value={current.analysis.composition} />
                <AnalysisFact label="文字層級" value={current.analysis.textHierarchy} />
              </div>
              {current.analysis.risks.length ? (
                <div><span className="font-medium">需注意：</span>{current.analysis.risks.join("、")}</div>
              ) : null}
              <div>
                <p className="font-medium">可以怎麼延伸</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-muted">
                  {current.analysis.recommendations.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          ) : null}
        </section>
        <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="flex items-center gap-2 text-sm font-medium">
            <WandSparkles className="size-4 text-accent" />
            延伸這張素材
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">保留原圖內容，改成 Story、Carousel 或 Reels Cover 的新視覺。生成結果會成為新素材，不覆蓋原圖。</p>
          <Textarea
            className="mt-3 min-h-24"
            value={editInstruction}
            onChange={(event) => setEditInstruction(event.target.value)}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Select value={editRatio} onValueChange={(value) => setEditRatio(value as typeof editRatio)}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="4:5">IG 貼文 4:5</SelectItem>
                <SelectItem value="1:1">方形 1:1</SelectItem>
                <SelectItem value="9:16">Story／Reels 9:16</SelectItem>
              </SelectContent>
            </Select>
            <Button className="min-h-11 flex-1" disabled={Boolean(aiBusy)} onClick={() => void edit()}>
              {aiBusy === "edit" ? "正在延伸一張…" : "生成新版本"}
            </Button>
          </div>
        </section>
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
            placeholder="例如：淡江禪學社、拍攝社員"
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

function AnalysisFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-fg">{label}</p>
      <p className="mt-0.5 text-muted">{value}</p>
    </div>
  );
}
