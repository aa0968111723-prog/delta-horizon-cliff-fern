import { BrainCircuit, WandSparkles } from "lucide-react";
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
  const addCreativeSource = useCampaignStore((s) => s.addCreativeSource);
  const [analyzing, setAnalyzing] = useState(false);
  const [similarBusy, setSimilarBusy] = useState(false);

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

  async function analyze() {
    setAnalyzing(true);
    try {
      const result = await analyzeCreativeAsset({
        data: { name: current.name, category: current.category, tags: current.tags },
      });
      if (!res.ok) {
        toast.warning(res.error);
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
              <img src={preview} alt="" className={cn("size-full", assetPreviewFitClass(current, preview))} />
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

        <div className="rounded-2xl bg-surface-2/70 p-3">
          <p className="text-sm font-medium">AI 怎麼用這張</p>
          {asset.insight ? (
            <div className="mt-2 space-y-1.5 text-xs text-muted">
              <p>
                {asset.insight.source === "live" ? "AI 看圖" : "本機規則"}
                {asset.insight.source === "local" ? "（依名稱、分類與標籤，不是線上模型看圖）" : ""}
              </p>
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
            {brand ? (
              <Button
                size="sm"
                variant={brand.memory.legacyAssetIds.includes(current.id) ? "default" : "secondary"}
                onClick={() => {
                  updateBrand(brand.id, {
                    memory: {
                      ...brand.memory,
                      legacyAssetIds: toggleLegacyAssetId(brand.memory.legacyAssetIds, current.id),
                    },
                  });
                  toast.success(
                    brand.memory.legacyAssetIds.includes(current.id)
                      ? "已從歷屆文宣拿掉"
                      : "已標成歷屆文宣，生成時會讀這張",
                  );
                }}
              >
                {brand.memory.legacyAssetIds.includes(current.id) ? "已是歷屆文宣" : "標成歷屆文宣"}
              </Button>
            ) : null}
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
          <Button variant="outline" disabled={busy !== null} onClick={onDelete}>
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
