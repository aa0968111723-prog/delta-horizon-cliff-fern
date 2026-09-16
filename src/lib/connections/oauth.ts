import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import {
  canvaConfigured,
  instagramConfigured,
  readBlobFromCookie,
  setBlobCookie,
  encryptState,
  decryptState,
  type OAuthBlob,
} from "./vault.server";
import { fetchCanvaDesigns, fetchInstagramMedia, probeDrive } from "./live";

type PkceState = { verifier: string; provider: "canva" | "instagram"; at: number };

function originFromRequest(req: Request) {
  const xf = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = xf || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export const getConnectionStatus = createServerFn({ method: "POST" }).handler(async () => {
  const req = getRequest();
  const blob = await readBlobFromCookie(req?.headers.get("cookie") ?? null);
  const drive = await probeDrive();
  return {
    drive: {
      id: "drive" as const,
      configured: true,
      connected: drive.connected,
      label: "Google Drive",
      account: drive.connected ? "Google Drive" : "",
      detail: drive.detail,
      loginUrl: drive.loginUrl,
    },
    canva: {
      id: "canva" as const,
      configured: canvaConfigured(),
      connected: Boolean(blob?.canva?.access),
      label: "Canva",
      account: blob?.canva?.account || "",
      detail: canvaConfigured()
        ? blob?.canva?.access
          ? "已連接。憑證存在伺服器。"
          : "使用 Canva 官方 OAuth。"
        : "尚未設定官方 Canva 應用程式。不會要求貼 Token。",
    },
    instagram: {
      id: "instagram" as const,
      configured: instagramConfigured(),
      connected: Boolean(blob?.instagram?.access),
      label: "Instagram",
      account: blob?.instagram?.account || "",
      detail: instagramConfigured()
        ? blob?.instagram?.access
          ? "已連接社團 IG。"
          : "使用 Meta / Instagram 官方 API。"
        : "尚未設定官方 Meta 應用程式。不會爬蟲、不會模擬登入。",
    },
  };
});

export const startOAuth = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({ provider: z.enum(["canva", "instagram"]) })
      .parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input),
  )
  .handler(async ({ data }) => {
    const req = getRequest();
    if (!req) return { ok: false as const, error: "無法開始連接" };
    const origin = originFromRequest(req);
    const { verifier, challenge } = pkce();
    const state = await encryptState({ verifier, provider: data.provider, at: Date.now() } satisfies PkceState);

    if (data.provider === "canva") {
      if (!canvaConfigured()) return { ok: false as const, error: "還沒有官方 Canva 應用程式。" };
      const url = new URL("https://www.canva.com/api/oauth/authorize");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", process.env.CANVA_CLIENT_ID ?? "");
      url.searchParams.set("redirect_uri", `${origin}/oauth/canva`);
      url.searchParams.set("scope", "design:meta:read design:content:read");
      url.searchParams.set("state", state);
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
      return { ok: true as const, url: url.toString() };
    }

    if (!instagramConfigured()) return { ok: false as const, error: "還沒有官方 Meta 應用程式。" };
    const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
    url.searchParams.set("redirect_uri", `${origin}/oauth/instagram`);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "instagram_basic,pages_show_list,instagram_manage_insights");
    return { ok: true as const, url: url.toString() };
  });

export const finishOAuth = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({ provider: z.enum(["canva", "instagram"]), code: z.string().min(1), state: z.string().min(1) })
      .parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input),
  )
  .handler(async ({ data }) => {
    const req = getRequest();
    if (!req) return { ok: false as const, error: "無法完成連接" };
    const pkceState = await decryptState<PkceState>(data.state);
    if (!pkceState || pkceState.provider !== data.provider || Date.now() - pkceState.at > 15 * 60_000) {
      return { ok: false as const, error: "授權已過期，請重新連接。" };
    }
    const origin = originFromRequest(req);
    const blob: OAuthBlob = { ...((await readBlobFromCookie(req.headers.get("cookie"))) ?? {}) };

    if (data.provider === "canva") {
      const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: data.code,
          redirect_uri: `${origin}/oauth/canva`,
          client_id: process.env.CANVA_CLIENT_ID ?? "",
          client_secret: process.env.CANVA_CLIENT_SECRET ?? "",
          code_verifier: pkceState.verifier,
        }),
      });
      if (!res.ok) return { ok: false as const, error: "Canva 授權失敗，請再試一次。" };
      const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
      if (!json.access_token) return { ok: false as const, error: "Canva 沒有回傳憑證。" };
      blob.canva = {
        access: json.access_token,
        refresh: json.refresh_token,
        expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
        account: "Canva",
      };
    } else {
      const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
      url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
      url.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
      url.searchParams.set("redirect_uri", `${origin}/oauth/instagram`);
      url.searchParams.set("code", data.code);
      const tokenRes = await fetch(url);
      if (!tokenRes.ok) return { ok: false as const, error: "Instagram 授權失敗，請再試一次。" };
      const json = (await tokenRes.json()) as { access_token?: string; expires_in?: number };
      if (!json.access_token) return { ok: false as const, error: "Instagram 沒有回傳憑證。" };
      blob.instagram = {
        access: json.access_token,
        expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
        account: "Instagram",
      };
    }

    await setBlobCookie(blob);
    return { ok: true as const };
  });

export const disconnectOAuth = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({ provider: z.enum(["canva", "instagram"]) })
      .parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input),
  )
  .handler(async ({ data }) => {
    const req = getRequest();
    const blob: OAuthBlob = { ...((await readBlobFromCookie(req?.headers.get("cookie") ?? null)) ?? {}) };
    if (data.provider === "canva") delete blob.canva;
    if (data.provider === "instagram") delete blob.instagram;
    await setBlobCookie(blob);
    return { ok: true as const };
  });

export const listConnectedMedia = createServerFn({ method: "POST" }).handler(async () => {
  const req = getRequest();
  const blob = await readBlobFromCookie(req?.headers.get("cookie") ?? null);
  const empty = { canva: [] as Awaited<ReturnType<typeof fetchCanvaDesigns>>, instagram: [] as Awaited<ReturnType<typeof fetchInstagramMedia>> };
  return Promise.race([
    Promise.all([fetchCanvaDesigns(blob), fetchInstagramMedia(blob)]).then(([canva, instagram]) => ({ canva, instagram })),
    new Promise<typeof empty>((resolve) => setTimeout(() => resolve(empty), 4000)),
  ]);
});
