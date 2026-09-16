import { withConnectNext } from "@/lib/connect/next";
import type { ConnectionId } from "@/lib/creative/types";

export function envReady(id: ConnectionId) {
  if (id === "google-drive") {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
  if (id === "canva") {
    return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
  }
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function oauthPath(id: ConnectionId) {
  if (id === "google-drive") return "/api/connect/google";
  if (id === "canva") return "/api/connect/canva";
  return "/api/connect/instagram";
}

export function oauthStartUrl(id: ConnectionId, next?: string) {
  return withConnectNext(oauthPath(id), next);
}
