import { BrainCircuit, WandSparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { launchFromAsset } from "@/components/create/from-asset";
import { createFromHit } from "@/components/create/from-hit";
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
import { LAUNCH_ACTIONS, launchSuccessMessage } from "@/lib/zen/from-asset";
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
  const [busy, setBusy] = useState<string | null>(null);

  if (!asset) return null;
  const current = asset;

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
        <div className="rounded-2xl bg-glow-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">AI 怎麼看這張</p>
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void analyze()} disabled={analyzing}>
              {analyzing ? <RefreshCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {asset.insight ? "重新分析" : "AI 分析"}
            </Button>
          </div>
          {asset.insight ? (
            <div className="mt-2 text-xs">
              <p className="text-sm leading-relaxed">{asset.insight.summary}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {asset.insight.palette.slice(0, 5).map((hex, i) => (
                  <span key={`${hex}-${i}`} className="size-4 rounded-full ring-2 ring-surface" style={{ backgroundColor: hex }} />
                ))}
                <span className="text-muted">
                  {asset.insight.mood} · 學生感 {Math.round(asset.insight.studentFit)} · 品牌感 {Math.round(asset.insight.brandFit)} · 停留感 {Math.round(asset.insight.stopPower)}
                </span>
              </div>
              {asset.insight.suggestions.length ? (
                <ul className="mt-2 space-y-0.5 text-muted">
                  {asset.insight.suggestions.map((sug, i) => (
                    <li key={i}>· {sug}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">分析畫面內容、色彩、構圖、學生感、品牌感、停留感，並自動加標籤。</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button size="sm" className="rounded-full" onClick={() => useInCreate("photo")}>
              加入創作
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => useInCreate("story")}>
              做成限動
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => useInCreate("carousel")}>
              做成 Carousel
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => useInCreate("reels")}>
              Reels 封面
            </Button>
          </div>
          {asset.externalRef ? <p className="mt-2 text-[11px] text-subtle">來源：{asset.externalRef.label ?? asset.externalRef.provider}</p> : null}
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={async () => {
              const ok = await createFromHit({
                id: current.id,
                source: current.source === "generated" ? "generated" : current.source === "drive" || current.source === "canva" || current.source === "instagram" ? current.source : "asset",
                title: current.name,
                subtitle: current.tags.join(" · ") || current.category,
                thumbAssetId: current.id,
                tags: current.tags,
              });
              if (ok) {
                onOpenChange(false);
                void navigate({ to: "/create" });
              }
            }}
          >
            加入創作
          </Button>
          <Button onClick={place} disabled={!lastProjectId || busy !== null}>
            放到目前畫布
          </Button>
          <Button
            variant="secondary"
            disabled={busy !== null}
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
        </div>
        <div>
          <p className="text-xs text-muted">從這張開始</p>
          <div className="mt-2 flex flex-wrap gap-2 pb-4">
          {LAUNCH_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="secondary"
              disabled={busy !== null}
              onClick={async () => {
                setBusy(action.id);
                try {
                  const result = await launchFromAsset({ asset: current, action: action.id });
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(launchSuccessMessage(action.id));
                  onOpenChange(false);
                  void navigate({ to: "/instagram" });
                } finally {
                  setBusy(null);
                }
              }}
            >
              {busy === action.id ? "生成中…" : action.label}
            </Button>
          ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pb-4">
          <Button variant="secondary" disabled={busy !== null} onClick={() => toggleFavorite(asset.id)}>
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
