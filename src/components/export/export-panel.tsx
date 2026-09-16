import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DownloadPackButton, PackExportHint } from "@/components/export/download-pack";
import { canvasToBlob, collectArtboardAssetIds, downloadBlob, renderArtboardToCanvas } from "@/lib/studio/export-png";
import { loadArtboardImages } from "@/lib/studio/export-download";
import { exportFilename } from "@/lib/studio/export-name";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { pagesOf } from "@/lib/studio/layers";
import { igPostText, packStats, packLimit, threadsPostText } from "@/lib/studio/post-pack";
import type { Artboard, BrandKit, Project } from "@/lib/studio/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

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
  const assets = useStudio((s) => s.assets);
  const [scale, setScale] = useState<1 | 2 | 3>(2);
  const [type, setType] = useState<"image/png" | "image/jpeg">("image/png");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const format = formatById(artboard.formatId);
  const outW = format.width * scale;
  const outH = format.height * scale;
  const pages = pagesOf(project, artboard.formatId);

  async function exportArtboard(target: Artboard, suffix: string) {
    const images = await loadArtboardImages(collectArtboardAssetIds(target, brand), assets);
    const canvas = await renderArtboardToCanvas(target, brand, images, scale);
    const blob = await canvasToBlob(canvas, type, 0.95);
    const ext = type === "image/png" ? "png" : "jpg";
    const filename = exportFilename(project.name, format.short, suffix, outW, outH, ext);
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

  async function exportPublishPack() {
    setBusy(true);
    setError(null);
    try {
      const stem = safePackStem(project.name);
      const manifest = publishPackManifest(stem, format.short, pages.length);
      const files: { name: string; blob: Blob }[] = [
        { name: manifest.noteName, blob: new Blob([buildExportCopyPack(project, { contentItems, campaigns })], { type: "text/plain;charset=utf-8" }) },
      ];
      for (let index = 0; index < pages.length; index += 1) {
        const target = pages[index]!;
        const images = await loadImages(collectArtboardAssetIds(target, brand));
        const canvas = await renderArtboardToCanvas(target, brand, images, scale);
        const blob = await canvasToBlob(canvas, "image/png", 0.95);
        const filename = manifest.imageNames[index] ?? `${stem}-p${index + 1}.png`;
        files.push({ name: filename, blob });
        recordExport(project.id, {
          id: uid("exp"),
          createdAt: Date.now(),
          formatId: target.formatId,
          scale,
          mime: "image/png",
          width: format.width * scale,
          height: format.height * scale,
          filename,
        });
      }
      downloadBlob(await zipBlobs(files), manifest.zipName);
      toast.success(pages.length > 1 ? `已下載一人發佈包：${pages.length} 頁畫布與備註` : "已下載一人發佈包：畫布 PNG 與備註");
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
          Instagram 以 1080 邊長為準。建議 PNG 2x 再壓縮。這是本機下載，不是發文，也不含官方 Insights。
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
      <Button className="w-full min-h-11" disabled={busy} onClick={() => void exportNow()}>
        {busy ? "匯出中…" : "下載此頁"}
      </Button>
      {pages.length > 1 ? (
        <Button className="w-full min-h-11" variant="secondary" disabled={busy} onClick={() => void exportCarousel()}>
          匯出輪播全部（{pages.length} 頁）
        </Button>
      ) : null}
      <Button
        variant="secondary"
        className="w-full min-h-11"
        onClick={async () => {
          const text = igPostText(project.copy);
          await navigator.clipboard.writeText(text);
          toast.success("已複製貼文文案");
        }}
      >
        複製貼文文案
      </Button>
      <p className="text-xs tabular-nums text-muted">
        {(() => {
          const stats = packStats(igPostText(project.copy), packLimit("ig"));
          return `貼文 ${stats.length} / ${stats.limit} 字${stats.over ? "，超過上限了" : ""}`;
        })()}
      </p>
      <Button
        variant="secondary"
        className="w-full"
        onClick={async () => {
          await navigator.clipboard.writeText(threadsPostText(project.copy));
          toast.success("已複製 Threads 文案");
        }}
      >
        複製 Threads 文案
      </Button>
      {project.copy.altText ? (
        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await navigator.clipboard.writeText(project.copy.altText);
            toast.success("已複製無障礙說明");
          }}
        >
          複製 Alt
        </Button>
      ) : (
        <p className="text-xs text-subtle">還沒有無障礙說明。套用一版文案後會自動寫一句畫面描述。</p>
      )}
      <DownloadPackButton projectId={project.id} className="w-full" variant="secondary" />
      <PackExportHint projectId={project.id} />
    </div>
  );
}
