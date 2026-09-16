import type { ProviderId } from "./providers.ts";
import type { RemoteItemKind } from "./remote.ts";

/** 帶進創作的圖：二進位上限，轉 data URL 後仍能塞進伺服器函式回應。 */
export const MEDIA_MAX_BYTES = 1_800_000;

export type ImportMediaResult =
  | {
      ok: true;
      dataUrl: string;
      name: string;
      mime: string;
      provider: ProviderId;
      title: string;
      href?: string;
    }
  | { ok: false; error: string };

export function canImportRemote(kind: RemoteItemKind | string): boolean {
  return kind === "image" || kind === "design" || kind === "post" || kind === "video";
}

export function driveMetaUrl(fileId: string): string {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set("fields", "id,name,mimeType,thumbnailLink,webViewLink");
  url.searchParams.set("supportsAllDrives", "true");
  return url.toString();
}

export function driveDownloadUrl(fileId: string): string {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set("alt", "media");
  url.searchParams.set("supportsAllDrives", "true");
  return url.toString();
}

export function enlargeDriveThumbnail(link: string): string {
  return link.replace(/=s\d+/, "=s1600");
}

export function instagramMediaUrl(mediaId: string): string {
  const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(mediaId)}`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink");
  return url.toString();
}

export function canvaExportUrl(): string {
  return "https://api.canva.com/rest/v1/exports";
}

export function canvaExportJobUrl(jobId: string): string {
  return `https://api.canva.com/rest/v1/exports/${encodeURIComponent(jobId)}`;
}

export function canvaDesignUrl(designId: string): string {
  return `https://api.canva.com/rest/v1/designs/${encodeURIComponent(designId)}`;
}

export function canvaExportBody(designId: string): { design_id: string; format: { type: "png" } } {
  return { design_id: designId, format: { type: "png" } };
}
