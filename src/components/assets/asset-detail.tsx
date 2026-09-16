import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { writeHandoff } from "@/lib/create/handoff";
import { generateStudioImage } from "@/lib/image/studio";
import { ASSET_CATEGORIES, createGeneratedAsset, kindFromCategory, sourceLabel, usageLabel } from "@/lib/studio/assets";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
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
  const [busy, setBusy] = useState<string | null>(null);

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
