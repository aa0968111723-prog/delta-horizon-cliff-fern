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
import { packCaptionsBlob, packDownloadableMembers, packSkippedKinds, type PackMember } from "./pack-export.ts";
import type { Artboard, AssetMeta, BrandKit, ContentKind, ExportVersion, Project } from "./types.ts";

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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type DownloadPackInput = {
  members: Project[];
  brand: BrandKit;
  assets: AssetMeta[];
  scale?: 1 | 2 | 3;
  type?: "image/png" | "image/jpeg";
  onRecord?: (projectId: string, version: ExportVersion) => void;
};

export type DownloadPackResult = {
  pageCount: number;
  visualCount: number;
  skipped: ContentKind[];
  failed: Array<{ id: string; kind: ContentKind; message: string }>;
  captionsFilename: string;
  captionsText: string;
  filenames: string[];
};

/** 一次帶走全套畫面，再下一份文案檔。Threads 只寫進文案，不匯出圖。 */
export async function downloadConvertPack(input: DownloadPackInput): Promise<DownloadPackResult> {
  if (!input.members.length) throw new Error("還沒有全套可以下載。先做成其他型態。");
  const visual = packDownloadableMembers(input.members as PackMember[]);
  const skipped = packSkippedKinds(input.members as PackMember[]);
  const captions = packCaptionsBlob(input.members);
  const filenames: string[] = [];
  const failed: DownloadPackResult["failed"] = [];

  for (let i = 0; i < visual.length; i += 1) {
    const project = visual[i] as Project;
    try {
      const result = await downloadProjectPages({
        project,
        brand: input.brand,
        assets: input.assets,
        scale: input.scale,
        type: input.type,
        onRecord: (version) => input.onRecord?.(project.id, version),
      });
      filenames.push(...result.filenames);
    } catch (err) {
      failed.push({
        id: project.id,
        kind: project.contentKind,
        message: err instanceof Error ? err.message : "匯出失敗",
      });
    }
    if (i < visual.length - 1) await wait(500);
  }

  if (visual.length) await wait(400);
  downloadBlob(new Blob([captions.text], { type: "text/plain;charset=utf-8" }), captions.filename);
  filenames.push(captions.filename);

  return {
    pageCount: filenames.length - 1,
    visualCount: visual.length,
    skipped,
    failed,
    captionsFilename: captions.filename,
    captionsText: captions.text,
    filenames,
  };
}
