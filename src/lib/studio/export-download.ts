import { getAssetBlob, hydrateSeedAsset } from "./assets-idb.ts";
import { isDisplayableImageBlob, pickExportImageSource } from "./assets.ts";
import {
  canvasToBlob,
  collectArtboardAssetIds,
  downloadBlob,
  renderArtboardToCanvas,
  type ImageMap,
} from "./export-png.ts";
import { exportFilename } from "./export-name.ts";
import { formatById } from "./formats.ts";
import { uid } from "./ids.ts";
import { pagesOf } from "./layers.ts";
import type { Artboard, AssetMeta, BrandKit, ExportVersion, Project } from "./types.ts";

export { exportFilename };

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("圖片載入失敗"));
    el.src = src;
  });
}

export async function loadArtboardImages(ids: string[], assets: AssetMeta[]): Promise<ImageMap> {
  const map: ImageMap = {};
  await Promise.all(
    [...new Set(ids)].map(async (id) => {
      const asset = assets.find((item) => item.id === id);
      let blob = await getAssetBlob(id);
      if ((!blob || !isDisplayableImageBlob(blob)) && asset?.seedSrc) {
        try {
          await hydrateSeedAsset(id, asset.seedSrc);
          blob = await getAssetBlob(id);
        } catch {
          /* 還是可以退回 public 路徑 */
        }
      }
      const source = pickExportImageSource(blob, asset?.seedSrc);
      if (!source) return;
      const url = source.kind === "blob" ? URL.createObjectURL(source.blob) : source.url;
      try {
        map[id] = await loadHtmlImage(url);
      } catch {
        /* 單張失敗不擋整張畫布匯出 */
      } finally {
        if (source.kind === "blob") URL.revokeObjectURL(url);
      }
    }),
  );
  return map;
}

export type DownloadPagesInput = {
  project: Project;
  brand: BrandKit;
  assets: AssetMeta[];
  pages?: Artboard[];
  scale?: 1 | 2 | 3;
  type?: "image/png" | "image/jpeg";
  onRecord?: (version: ExportVersion) => void;
};

export async function downloadProjectPages(input: DownloadPagesInput): Promise<{ count: number; filenames: string[] }> {
  const scale = input.scale ?? 2;
  const type = input.type ?? "image/png";
  const pages = input.pages ?? pagesOf(input.project);
  if (!pages.length) throw new Error("還沒有畫面可以下載。先進畫面放圖。");
  const ext = type === "image/png" ? "png" : "jpg";
  const filenames: string[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    const target = pages[i];
    const format = formatById(target.formatId);
    const images = await loadArtboardImages(collectArtboardAssetIds(target, input.brand), input.assets);
    const canvas = await renderArtboardToCanvas(target, input.brand, images, scale);
    const blob = await canvasToBlob(canvas, type, 0.95);
    const suffix = pages.length > 1 ? `-p${i + 1}` : "";
    const filename = exportFilename(
      input.project.name,
      format.short,
      suffix,
      format.width * scale,
      format.height * scale,
      ext,
    );
    downloadBlob(blob, filename);
    filenames.push(filename);
    input.onRecord?.({
      id: uid("exp"),
      createdAt: Date.now(),
      formatId: target.formatId,
      scale,
      mime: type,
      width: format.width * scale,
      height: format.height * scale,
      filename,
    });
    if (i < pages.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
    }
  }
  return { count: pages.length, filenames };
}
