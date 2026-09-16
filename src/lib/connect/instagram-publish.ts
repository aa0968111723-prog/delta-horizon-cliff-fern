import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hostImageOnCanva } from "./canva-export";
import { hostImageOnDrive } from "./drive-publish";
import { accessTokenFor } from "./tokens";
import {
  accountsUrl,
  carouselAlbumParams,
  carouselItemParams,
  graphContainerParams,
  isPublicImageUrl,
  isStoryGraphFormat,
  mediaContainerUrl,
  mediaInsightsUrl,
  mediaPermalinkUrl,
  mediaPublishUrl,
  parseContainerId,
  parseIgInsights,
  parseIgUser,
  parsePermalink,
  parsePublishId,
  waitUntilContainerReady,
} from "./instagram-graph";

export type PublishResult =
  | {
      ok: true;
      mediaId: string;
      permalink?: string;
      note: string;
      imageUrl: string;
      hostedBy: "given" | "drive" | "canva";
      insights?: Record<string, number>;
    }
  | { ok: false; reason: "not-connected" | "no-image" | "api"; note: string };

const Input = z.object({
  caption: z.string().min(1).max(2200),
  imageUrl: z.string().max(2000).optional(),
  imageUrls: z.array(z.string().max(2000)).max(10).optional(),
  imageBase64: z.string().max(4_000_000).optional(),
  imageBase64s: z.array(z.string().max(4_000_000)).max(6).optional(),
  mime: z.string().max(40).optional(),
  title: z.string().max(80).optional(),
  format: z.string().max(40).optional(),
});

function parseInput(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "caption" in inner) return Input.parse(inner);
  }
  return Input.parse(input);
}

async function graphJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(json.error?.message || String(res.status));
  }
  return json;
}

async function graphStatus(url: string) {
  const res = await fetch(url);
  return res.json().catch(() => ({}));
}

async function hostOneBase64(
  imageBase64: string,
  title: string,
  format?: string,
): Promise<{ url: string; hostedBy: "drive" | "canva" } | null> {
  const drive = await accessTokenFor("drive");
  if (drive) {
    const url = await hostImageOnDrive({
      token: drive.accessToken,
      bytes: Buffer.from(imageBase64, "base64"),
      name: `${title}.png`,
    }).catch(() => null);
    if (url && isPublicImageUrl(url)) return { url, hostedBy: "drive" };
  }
  const canva = await accessTokenFor("canva");
  if (canva) {
    const url = await hostImageOnCanva({
      token: canva.accessToken,
      imageBase64,
      title,
      format,
    }).catch(() => null);
    if (url && isPublicImageUrl(url)) return { url, hostedBy: "canva" };
  }
  return null;
}

async function hostPublicImages(
  data: z.infer<typeof Input>,
): Promise<{ urls: string[]; hostedBy: "given" | "drive" | "canva" } | null> {
  const urls: string[] = [];
  for (const url of [data.imageUrl, ...(data.imageUrls ?? [])]) {
    if (url && isPublicImageUrl(url) && !urls.includes(url)) urls.push(url);
  }
  const bases = data.imageBase64s?.length ? data.imageBase64s : data.imageBase64 ? [data.imageBase64] : [];
  let hostedBy: "given" | "drive" | "canva" = urls.length ? "given" : "drive";
  let index = 0;
  for (const base64 of bases) {
    if (urls.length >= 10) break;
    index += 1;
    const hosted = await hostOneBase64(base64, `${data.title || "禪光主視覺"}-${index}`, data.format);
    if (!hosted) continue;
    if (!urls.includes(hosted.url)) urls.push(hosted.url);
    hostedBy = hosted.hostedBy;
  }
  if (!urls.length) return null;
  return { urls: urls.slice(0, 10), hostedBy: urls.length && !bases.length ? "given" : hostedBy };
}

async function waitReady(containerId: string, token: string) {
  return waitUntilContainerReady({
    containerId,
    token,
    fetchJson: graphStatus,
  });
}

async function createContainer(igId: string, token: string, params: Record<string, string>) {
  const url = new URL(mediaContainerUrl(igId));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", token);
  const json = await graphJson(url.toString(), { method: "POST" });
  return parseContainerId(json);
}

async function publishCreation(igId: string, token: string, creationId: string) {
  const ready = await waitReady(creationId, token);
  if (!ready.ok) return null;
  const publishUrl = new URL(mediaPublishUrl(igId));
  publishUrl.searchParams.set("creation_id", creationId);
  publishUrl.searchParams.set("access_token", token);
  const published = await graphJson(publishUrl.toString(), { method: "POST" });
  return parsePublishId(published);
}

async function publishCarousel(igId: string, token: string, urls: string[], caption: string) {
  const childIds: string[] = [];
  for (const imageUrl of urls.slice(0, 10)) {
    const item = carouselItemParams(imageUrl);
    const childId = await createContainer(igId, token, item);
    if (!childId) continue;
    const ready = await waitReady(childId, token);
    if (ready.ok) childIds.push(childId);
  }
  if (childIds.length < 2) return null;
  const album = carouselAlbumParams(childIds, caption);
  const albumId = await createContainer(igId, token, album);
  if (!albumId) return null;
  return publishCreation(igId, token, albumId);
}

async function readPermalink(mediaId: string, token: string) {
  try {
    const permalinkUrl = new URL(mediaPermalinkUrl(mediaId));
    permalinkUrl.searchParams.set("access_token", token);
    return parsePermalink(await graphJson(permalinkUrl.toString())) ?? undefined;
  } catch {
    return undefined;
  }
}

async function readInsights(mediaId: string, token: string) {
  try {
    const url = new URL(mediaInsightsUrl(mediaId));
    url.searchParams.set("access_token", token);
    return parseIgInsights(await graphJson(url.toString()));
  } catch {
    return {} as Record<string, number>;
  }
}

export const publishInstagramMedia = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseInput(input))
  .handler(async ({ data }): Promise<PublishResult> => {
    const bundle = await accessTokenFor("instagram");
    if (!bundle) {
      return {
        ok: false,
        reason: "not-connected",
        note: "先到「連接」用官方 OAuth 連接 Instagram。文案可先複製，本機標記已發布。",
      };
    }
    const hosted = await hostPublicImages(data);
    if (!hosted) {
      return {
        ok: false,
        reason: "no-image",
        note: "官方發布需要公開 PNG。請連接 Google Drive 或 Canva（需重新授權寫入），或先複製文案後標記已發布。",
      };
    }
    try {
      let ig: { id: string; username?: string } | null = bundle.igUserId
        ? { id: bundle.igUserId, username: bundle.accountLabel }
        : null;
      if (!ig?.id) {
        const accounts = await graphJson(accountsUrl(bundle.accessToken));
        ig = parseIgUser(accounts);
      }
      if (!ig?.id) {
        return { ok: false, reason: "api", note: "找不到 Instagram 專業帳號。請重新授權。" };
      }
      const story = isStoryGraphFormat(data.format);
      let mediaId: string | null = null;
      if (!story && hosted.urls.length >= 2) {
        mediaId = await publishCarousel(ig.id, bundle.accessToken, hosted.urls, data.caption);
      }
      if (!mediaId) {
        const params = graphContainerParams({
          imageUrl: hosted.urls[0]!,
          caption: data.caption,
          format: data.format,
        });
        const creationId = await createContainer(ig.id, bundle.accessToken, params);
        if (!creationId) {
          return { ok: false, reason: "api", note: "IG 還沒準備好這則容器，請稍後再試。" };
        }
        mediaId = await publishCreation(ig.id, bundle.accessToken, creationId);
      }
      if (!mediaId) {
        return { ok: false, reason: "api", note: "IG 發布沒有回傳編號。可能還在轉檔，請稍後再試。" };
      }
      const permalink = story ? undefined : await readPermalink(mediaId, bundle.accessToken);
      const insights = await readInsights(mediaId, bundle.accessToken);
      const hostedNote =
        hosted.hostedBy === "drive"
          ? "主視覺已進 Google Drive「禪光發布」，"
          : hosted.hostedBy === "canva"
            ? "主視覺已從 Canva 匯出，"
            : "";
      const carouselNote = story
        ? "已用 Instagram 官方 API 發到限動。"
        : hosted.urls.length >= 2
          ? "已發 Carousel。"
          : "已用 Instagram 官方 API 發到帳號。";
      return {
        ok: true,
        mediaId,
        permalink,
        imageUrl: hosted.urls[0]!,
        hostedBy: hosted.hostedBy,
        insights,
        note: `${hostedNote}${carouselNote}`.trim(),
      };
    } catch (error) {
      return {
        ok: false,
        reason: "api",
        note: error instanceof Error ? error.message : "IG 官方發布暫時失敗。文案可先複製。",
      };
    }
  });
