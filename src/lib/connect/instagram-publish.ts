import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { accessTokenFor } from "./tokens";
import {
  accountsUrl,
  containerParams,
  isPublicImageUrl,
  mediaContainerUrl,
  mediaPublishUrl,
  parseContainerId,
  parseIgUser,
  parsePublishId,
} from "./instagram-graph";

export type PublishResult =
  | { ok: true; mediaId: string; note: string }
  | { ok: false; reason: "not-connected" | "no-image" | "api"; note: string };

const Input = z.object({
  caption: z.string().min(1).max(2200),
  imageUrl: z.string().max(2000).optional(),
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
    const imageUrl = data.imageUrl ?? "";
    if (!isPublicImageUrl(imageUrl)) {
      return {
        ok: false,
        reason: "no-image",
        note: "官方發布需要可公開存取的圖片網址。本機圖先複製文案，發完再標記已發布。",
      };
    }
    try {
      const accounts = await graphJson(accountsUrl(bundle.accessToken));
      const ig = parseIgUser(accounts);
      if (!ig?.id) {
        return { ok: false, reason: "api", note: "找不到 Instagram 專業帳號。請重新授權。" };
      }
      const params = containerParams({ imageUrl, caption: data.caption });
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
      return { ok: true, mediaId, note: "已用 Instagram 官方 API 發到帳號。" };
    } catch (error) {
      return {
        ok: false,
        reason: "api",
        note: error instanceof Error ? error.message : "IG 官方發布暫時失敗。文案可先複製。",
      };
    }
  });
