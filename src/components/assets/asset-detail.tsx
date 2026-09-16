import { BrainCircuit, WandSparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ImageRevisionBar } from "@/components/create/image-revision";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeImage } from "@/lib/ai/vision";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { tagsFromAssetText, tagsFromVision } from "@/lib/studio/asset-tags";
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
  const placeAsset = useStudio((s) => s.placeAsset);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);

  if (!asset) return null;
  const current = asset;
  const preview = url || current.seedSrc;

  async function analyze() {
    if (!brand) return;
    setAnalyzing(true);
    try {
      const blob = await getAssetBlob(current.id);
      const dataUrl = blob && blob.size < 4_500_000 ? await blobToDataUrl(blob) : undefined;
      const res = await analyzeZenImage({
        data: { brandContext: brandMemoryContext(brand).slice(0, 3000), imageDataUrl: dataUrl, fileName: current.name, hints: current.tags.join("、") },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const insight: AssetInsight = {
        summary: res.insight.summary,
        subjects: res.insight.subjects,
        palette: res.insight.palette,
        mood: res.insight.mood,
        studentFit: res.insight.studentFit,
        brandFit: res.insight.brandFit,
        stopPower: res.insight.stopPower,
        warnings: res.insight.warnings,
        suggestions: res.insight.suggestions,
        analyzedAt: Date.now(),
        source: res.source,
      };
      updateAsset(current.id, {
        insight,
        tags: [...new Set([...current.tags, ...res.insight.tags])],
        licenseNotes: current.licenseNotes || (res.insight.extendPrompt ? `延伸 Prompt：${res.insight.extendPrompt}` : ""),
      });
      toast.success(res.source === "live" ? "AI 看完了" : "已用本機推斷加上標籤（AI 視覺連線後會真的看圖）");
    } finally {
      setAnalyzing(false);
    }
  }

  function useInCreate(mode: "photo" | "story" | "carousel" | "reels") {
    const hint = current.insight?.summary ?? current.name;
    onOpenChange(false);
    void navigate({ to: "/create", search: { mode, idea: `用素材「${current.name}」：${hint.slice(0, 80)}` } });
  }

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
      const result = await analyzeStudioImage({
        data: {
          imageBase64: b64,
          mime: blob.type || current.mime,
          sourceNote: `${sourceLabel(current.source)} / ${current.name}`.slice(0, 200),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const tags = tagsFromVision(result.analysis, current.tags);
      updateAsset(current.id, { tags, licenseNotes: result.analysis.content.slice(0, 180) });
      setNotes(result.analysis.suggestions);
      setVision(result.analysis);
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
      toast.error(current.width === 0 ? "這是來源參考，沒有原圖像素，不能放到畫布。" : "無法放到畫布");
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
            {asset.provenance ? (
              <p className="mt-1 break-words">
                出處：{asset.provenance.label}
                {asset.provenance.collection ? `／${asset.provenance.collection}` : ""}
                {asset.provenance.externalId ? `／${asset.provenance.externalId}` : ""}
                {asset.provenance.sourceDate ? `／${asset.provenance.sourceDate}` : ""}
              </p>
            ) : null}
            {asset.source === "google-drive" && asset.width === 0 ? (
              <p className="mt-1 text-warn">這是 Drive 來源參考，沒有原圖像素，不能放到畫布，也不會用假檔冒充。</p>
            ) : null}
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
          <Button variant="secondary" disabled={busy} data-testid="asset-analyze" onClick={() => void analyze()}>
            {busy ? "分析中…" : "AI 分析／標籤"}
          </Button>
          <Button onClick={place} disabled={!lastProjectId || isVideoAsset(current)} variant="secondary">
            放到目前畫布
          </Button>
        </div>
        {vision ? <VisionCard vision={vision} /> : null}
        {notes?.length && !vision ? (
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
        <section className="rounded-2xl bg-surface-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <BrainCircuit className="size-4 text-accent" />
                AI 視覺理解
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">從淡江學生與 IG 停留感檢查這張本機素材。按下才會花費額度；成功後寫入 Brand Memory，不會假裝 Grok 看過沒分析的圖。</p>
            </div>
            <Button size="sm" className="min-h-11" variant="secondary" disabled={Boolean(aiBusy)} onClick={() => void analyze()} data-testid="analyze-asset">
              {aiBusy === "analyze" ? "分析中…" : current.analysis ? "重新分析" : "AI 分析"}
            </Button>
          </div>
          <ImageServiceNotice status={imageStatus} purpose="analyze" className="mt-3" />
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
              <Button
                size="sm"
                className="min-h-11"
                variant="secondary"
                onClick={() => {
                  if (!current.analysis) return;
                  writeVisualMemory(current.analysis);
                  toast.success("已把畫面分析寫入 Brand Memory");
                }}
              >
                寫入 Brand Memory
              </Button>
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
            onClick={() => {
              void navigate({
                to: "/create",
                search: { q: `用「${asset.name}」做新的網宣`, mode: "vision", go: "1", asset: asset.id },
              });
              onOpenChange(false);
            }}
          >
            加入創作
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void navigate({
                to: "/create",
                search: { q: `延續「${asset.name}」的風格生成相似視覺`, mode: "image", go: "1", asset: asset.id },
              });
              onOpenChange(false);
            }}
          >
            生成相似視覺
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void navigate({
                to: "/create",
                search: { q: `用「${asset.name}」寫一篇 IG 文案`, mode: "post", go: "1", asset: asset.id },
              });
              onOpenChange(false);
            }}
          >
            生成文案
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void (async () => {
                try {
                  const blob = await getAssetStorage().get(current.id);
                  let imageDataUrl = url?.startsWith("data:") ? url : undefined;
                  let imageUrl = url?.startsWith("https:") ? url : undefined;
                  if (!imageDataUrl && blob) {
                    imageDataUrl = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(String(reader.result));
                      reader.onerror = () => reject(new Error("read"));
                      reader.readAsDataURL(blob);
                    });
                  }
                  const result = await analyzeImage({
                    data: imageUrl ? { imageUrl, note: current.name } : { imageDataUrl: imageDataUrl ?? "", note: current.name },
                  });
                  if (!result.ok) return;
                  const tags = Array.from(new Set([...current.tags, ...tagsFromVision(result.report)]));
                  const note = result.report.studentFit;
                  const licenseNotes = current.licenseNotes.includes(note)
                    ? current.licenseNotes
                    : `${current.licenseNotes}\n${note}`.trim();
                  updateAsset(current.id, { tags, licenseNotes });
                  toast.success(result.report.studentFit);
                } catch {
                  toast.error("分析失敗");
                }
              })();
            }}
          >
            AI 分析
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const tags = Array.from(
                new Set([...asset.tags, ...tagsFromAssetText(asset.name, asset.category, asset.licenseNotes)]),
              );
              patch("tags", tags);
              toast.success("已補上 AI 標籤草稿，可再改");
            }}
          >
            AI Tag
          </Button>
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
