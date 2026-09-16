import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hostImageOnCanva } from "./canva-export";
import { hostImageOnDrive } from "./drive-publish";
import { accessTokenFor } from "./tokens";
import {
  accountsUrl,
  containerParams,
  isPublicImageUrl,
  mediaContainerUrl,
  mediaPermalinkUrl,
  mediaPublishUrl,
  parseContainerId,
  parseIgUser,
  parsePermalink,
  parsePublishId,
} from "./instagram-graph";

export type PublishResult =
  | { ok: true; mediaId: string; permalink?: string; note: string; imageUrl: string; hostedBy: "given" | "drive" | "canva" }
  | { ok: false; reason: "not-connected" | "no-image" | "api"; note: string };

const Input = z.object({
  caption: z.string().min(1).max(2200),
  imageUrl: z.string().max(2000).optional(),
  imageBase64: z.string().max(4_000_000).optional(),
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

async function hostPublicImage(data: z.infer<typeof Input>): Promise<{ url: string; hostedBy: "given" | "drive" | "canva" } | null> {
  if (isPublicImageUrl(data.imageUrl)) {
    return { url: data.imageUrl!, hostedBy: "given" };
  }
  if (!data.imageBase64) return null;
  const drive = await accessTokenFor("drive");
  if (drive) {
    const url = await hostImageOnDrive({
      token: drive.accessToken,
      bytes: Buffer.from(data.imageBase64, "base64"),
      name: `${data.title || "禪光主視覺"}.png`,
    }).catch(() => null);
    if (url && isPublicImageUrl(url)) return { url, hostedBy: "drive" };
  }
  const canva = await accessTokenFor("canva");
  if (canva) {
    const url = await hostImageOnCanva({
      token: canva.accessToken,
      imageBase64: data.imageBase64,
      title: data.title || "禪光",
      format: data.format,
    }).catch(() => null);
    if (url && isPublicImageUrl(url)) return { url, hostedBy: "canva" };
  }
  return null;
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
    const hosted = await hostPublicImage(data);
    if (!hosted) {
      return {
        ok: false,
        reason: "no-image",
        note: "官方發布需要公開 PNG。請連接 Google Drive 或 Canva（需重新授權寫入），或先複製文案後標記已發布。",
      };
    }
    try {
      const accounts = await graphJson(accountsUrl(bundle.accessToken));
      const ig = parseIgUser(accounts);
      if (!ig?.id) {
        return { ok: false, reason: "api", note: "找不到 Instagram 專業帳號。請重新授權。" };
      }
      const params = containerParams({ imageUrl: hosted.url, caption: data.caption });
      const containerUrl = new URL(mediaContainerUrl(ig.id));
      containerUrl.searchParams.set("image_url", params.image_url);
      containerUrl.searchParams.set("caption", params.caption);
      containerUrl.searchParams.set("access_token", bundle.accessToken);
      const container = await graphJson(containerUrl.toString(), { method: "POST" });
      const creationId = parseContainerId(container);
      if (!creationId) {
        return { ok: false, reason: "api", note: "IG 還沒準備好這則容器，請稍後再試。" };
      }
      const publishUrl = new URL(mediaPublishUrl(ig.id));
      publishUrl.searchParams.set("creation_id", creationId);
      publishUrl.searchParams.set("access_token", bundle.accessToken);
      const published = await graphJson(publishUrl.toString(), { method: "POST" });
      const mediaId = parsePublishId(published);
      if (!mediaId) {
        return { ok: false, reason: "api", note: "IG 發布沒有回傳編號。" };
      }
      let permalink: string | undefined;
      try {
        const permalinkUrl = new URL(mediaPermalinkUrl(mediaId));
        permalinkUrl.searchParams.set("access_token", bundle.accessToken);
        permalink = parsePermalink(await graphJson(permalinkUrl.toString())) ?? undefined;
      } catch {
        permalink = undefined;
      }
      const hostedNote =
        hosted.hostedBy === "drive"
          ? "主視覺已進 Google Drive「禪光發布」，"
          : hosted.hostedBy === "canva"
            ? "主視覺已從 Canva 匯出，"
            : "";
      return {
        ok: true,
        mediaId,
        permalink,
        imageUrl: hosted.url,
        hostedBy: hosted.hostedBy,
        note: `${hostedNote}已用 Instagram 官方 API 發到帳號。`.trim(),
      };
    } catch (error) {
      return {
        ok: false,
        reason: "api",
        note: error instanceof Error ? error.message : "IG 官方發布暫時失敗。文案可先複製。",
      };
    }
  });
