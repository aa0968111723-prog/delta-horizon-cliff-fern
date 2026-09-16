import { useNavigate } from "@tanstack/react-router";
import { RefreshCw, Sparkles } from "lucide-react";
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
import { analyzeZenImage } from "@/lib/ai/zen";
import { ASSET_CATEGORIES, sourceLabel, usageLabel } from "@/lib/studio/assets";
import { kindFromCategory } from "@/lib/studio/assets";
import { getAssetBlob } from "@/lib/studio/assets-idb";
import { brandMemoryContext } from "@/lib/studio/brand";
import { blobToDataUrl } from "@/lib/studio/generated-assets";
import type { AssetCategory, AssetInsight, AssetMeta, AssetUsageStatus } from "@/lib/studio/types";
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
  const brand = useStudio((s) => s.brands[0]);
  const [analyzing, setAnalyzing] = useState(false);

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
      toast.error("無法放到畫布");
      return;
    }
    toast.success(`已放入「${current.name}」`);
    onOpenChange(false);
    void navigate({ to: "/studio/$projectId", params: { projectId: lastProjectId } });
  }

  async function dataUrl() {
    return loadAssetDataUrl({ id: current.id, seedSrc: current.seedSrc, previewUrl: url });
  }

  function goCreate(tab: "campaign" | "copy" | "image" | "vision" | "convert", idea: string, extra?: { convertKind?: ReturnType<typeof convertKindFromAction> }) {
    writeHandoff({
      idea,
      tab,
      assetId: current.id,
      sourceLabel: `${sourceLabel(current.source)} / ${current.name}`,
      convertKind: extra?.convertKind,
    });
    onOpenChange(false);
    void navigate({ to: "/create", search: { tab } });
  }

  async function analyze() {
    setBusy(true);
    try {
      const image = await dataUrl();
      if (!image) {
        toast.error("找不到這張圖的檔案");
        return;
      }
      const result = await analyzeImage({
        data: {
          imageDataUrl:
            compactDataUrl(image, 5_500_000) ||
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          note: `${current.name} ${current.tags.join(" ")}`.slice(0, 240),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReport(result.report);
      const tags = mergeAssetTags(current.tags, tagsFromVision(result.report, [current.name]));
      updateAsset(current.id, { tags });
      toast.success("已分析並加上 AI 標籤");
    } finally {
      setBusy(false);
    }
  }

  async function extend(action: "similar" | "continue") {
    setBusy(true);
    try {
      const image = await dataUrl();
      const prompt = report
        ? promptFromVision(report, action)
        : `延續「${current.name}」的風格，做新的淡江禪學社主視覺。${current.tags.join(" ")}`;
      const editUrl = image ? compactDataUrl(image) : null;
      const result = await generateStudioImage({
        data: {
          prompt: prompt.slice(0, 1200),
          headline: report?.hierarchy?.slice(0, 24) || "最近是不是很久沒有好好坐下來？",
          eventName: current.name.slice(0, 40),
          editUrls: editUrl ? [editUrl] : undefined,
        },
      });
      const nextUrl = result.urls[0];
      if (!nextUrl) {
        toast.error("圖片暫時無法生成");
        return;
      }
      const res = await fetch(nextUrl);
      const blob = await res.blob();
      const id = uid("asset");
      await getAssetStorage().put(id, blob);
      const format = formatById("feed-portrait");
      addAsset(
        createGeneratedAsset({
          id,
          name: `${action === "similar" ? "相似視覺" : "風格延伸"} · ${current.name}`,
          mime: blob.type || "image/png",
          width: format.width,
          height: format.height,
          category: current.category === "logo" ? "poster" : current.category,
          tags: mergeAssetTags(["AI生成", "延伸", current.name], current.tags),
        }),
      );
      toast.success(`已存進素材庫 · 來源：AI Generated（參考 ${sourceLabel(current.source)} / ${current.name}）`);
    } finally {
      setBusy(false);
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
            placeholder="例如：禪學社攝影、社員姓名"
          />
        </div>
        {report ? (
          <div className="rounded-2xl bg-bg p-3 text-sm">
            <p className="font-medium">AI 分析</p>
            <p className="mt-2 text-muted">{report.content}</p>
            <p className="mt-1 text-xs text-muted">品牌感：{report.brandFeel}</p>
            <p className="mt-1 text-xs text-muted">學生感：{report.studentFeel}</p>
            <p className="mt-1 text-xs text-muted">太宗教？{report.tooReligious}</p>
          </div>
        ) : null}
        <p className="text-xs text-muted">來源與授權只存在此裝置，不會上傳到雲端。</p>
        <div className="flex flex-wrap gap-2 pb-4">
          <Button onClick={place} disabled={!lastProjectId}>
            放到目前畫布
          </Button>
          <Button data-testid="asset-analyze" variant="secondary" disabled={busy} onClick={() => void analyze()}>
            {busy ? "分析中…" : "AI 分析／Tag"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              goCreate(
                "campaign",
                report ? ideaFromVision("continue", report, current.name) : `從素材開始：${current.name}`,
              )
            }
          >
            加入創作
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void extend("continue")}>
            延伸生成
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void extend("similar")}>
            生成相似視覺
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              goCreate("copy", report ? `${report.content}\n${current.name}` : current.name)
            }
          >
            生成文案
          </Button>
          {report
            ? report.actions
                .filter((action) => action.id === "story" || action.id === "carousel" || action.id === "reels")
                .map((action) => (
                  <Button
                    key={action.id}
                    variant="secondary"
                    onClick={() =>
                      goCreate("campaign", ideaFromVision(action.id, report, current.name), {
                        convertKind: convertKindFromAction(action.id),
                      })
                    }
                  >
                    {action.label}
                  </Button>
                ))
            : null}
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
