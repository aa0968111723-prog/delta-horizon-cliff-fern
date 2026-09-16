import { useState } from "react";
import { toast } from "sonner";
import { PublishButton } from "@/components/create/publish-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { canvasToBlob, collectArtboardAssetIds, downloadBlob, renderArtboardToCanvas } from "@/lib/studio/export-png";
import { formatById } from "@/lib/studio/formats";
import { getAssetBlob } from "@/lib/studio/assets-idb";
import { uid } from "@/lib/studio/ids";
import { pagesOf } from "@/lib/studio/layers";
import type { Artboard, BrandKit, Project } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

async function loadImages(ids: string[]): Promise<Record<string, HTMLImageElement>> {
  const map: Record<string, HTMLImageElement> = {};
  await Promise.all(
    [...new Set(ids)].map(async (id) => {
      const blob = await getAssetBlob(id);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("圖片載入失敗"));
          el.src = url;
        });
        map[id] = img;
      } finally {
        URL.revokeObjectURL(url);
      }
    }),
  );
  return map;
}

export function ExportPanel({
  project,
  brand,
  artboard,
}: {
  project: Project;
  brand: BrandKit;
  artboard: Artboard;
}) {
  const recordExport = useStudio((s) => s.recordExport);
  const [scale, setScale] = useState<1 | 2 | 3>(2);
  const [type, setType] = useState<"image/png" | "image/jpeg">("image/png");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const format = formatById(artboard.formatId);
  const outW = format.width * scale;
  const outH = format.height * scale;
  const pages = pagesOf(project, artboard.formatId);

  async function exportArtboard(target: Artboard, suffix: string) {
    const images = await loadImages(collectArtboardAssetIds(target, brand));
    const canvas = await renderArtboardToCanvas(target, brand, images, scale);
    const blob = await canvasToBlob(canvas, type, 0.95);
    const ext = type === "image/png" ? "png" : "jpg";
    const safe = project.name.replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "export";
    const filename = `${safe}-${format.short}${suffix}-${outW}x${outH}.${ext}`;
    downloadBlob(blob, filename);
    recordExport(project.id, {
      id: uid("exp"),
      createdAt: Date.now(),
      formatId: target.formatId,
      scale,
      mime: type,
      width: outW,
      height: outH,
      filename,
    });
  }

  async function exportNow() {
    setBusy(true);
    setError(null);
    try {
      await exportArtboard(artboard, "");
      toast.success("已開始下載此頁");
    } catch (err) {
      const message = err instanceof Error ? err.message : "匯出失敗";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function exportCarousel() {
    setBusy(true);
    setError(null);
    try {
      for (let i = 0; i < pages.length; i += 1) {
        await exportArtboard(pages[i], `-p${i + 1}`);
        if (i < pages.length - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 450));
        }
      }
      toast.success(`已匯出 ${pages.length} 頁輪播`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "匯出失敗";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium">高畫質輸出</h2>
        <p className="mt-1 text-xs text-muted">
          Instagram 以 1080 邊長為準。建議 PNG 2x 再壓縮，避免平台二次糊掉。
        </p>
      </div>
      <div>
        <Label>倍率</Label>
        <div className="mt-2 flex gap-2">
          {([1, 2, 3] as const).map((n) => (
            <Button key={n} size="sm" variant={scale === n ? "default" : "secondary"} onClick={() => setScale(n)}>
              {n}x
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-subtle tabular-nums">
          {outW} × {outH} px · {format.name}
          {pages.length > 1 ? ` · ${pages.length} 頁輪播` : ""}
        </p>
      </div>
      <div>
        <Label>格式</Label>
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant={type === "image/png" ? "default" : "secondary"}
            onClick={() => setType("image/png")}
          >
            PNG
          </Button>
          <Button
            size="sm"
            variant={type === "image/jpeg" ? "default" : "secondary"}
            onClick={() => setType("image/jpeg")}
          >
            JPEG
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button className="w-full" disabled={busy} onClick={() => void exportNow()}>
        {busy ? "匯出中…" : "下載此頁"}
      </Button>
      {pages.length > 1 ? (
        <Button className="w-full" variant="secondary" disabled={busy} onClick={() => void exportCarousel()}>
          匯出輪播全部（{pages.length} 頁）
        </Button>
      ) : null}
      <Button
        variant="secondary"
        className="w-full"
        onClick={async () => {
          const text = `${project.copy.caption}\n\n${project.copy.hashtags.join(" ")}`.trim();
          await navigator.clipboard.writeText(text);
          toast.success("已複製貼文文案");
        }}
      >
        複製貼文文案
      </Button>
      <p className="text-xs text-muted">下載只是檔案，不會當成已發布。真正發出後再標記，下次 AI 才會學這篇。</p>
      <PublishButton
        projectId={project.id}
        campaignId={project.campaignId ?? undefined}
        title={project.name}
        size="default"
        variant="secondary"
        className="w-full"
      />
      {project.copy.altText ? (
        <p className="text-xs text-muted">Alt：{project.copy.altText}</p>
      ) : null}
    </div>
  );
}
