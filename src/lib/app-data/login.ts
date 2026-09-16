import type { CallToolResult } from "./types.ts";

export function isLoginRequired(result: CallToolResult): boolean {
  return result.ok === false && result.loginRequired === true;
}

function isFramed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function redirectToLoginIfRequired(result: CallToolResult): boolean {
  if (!isLoginRequired(result)) return false;
  const url = result.loginUrl;
  if (!url) return false;
  if (typeof window === "undefined") return false;
  if (isFramed()) {
    const opened = window.open(url, "_blank");
    if (opened) {
      opened.opener = null;
      return true;
    }
  }
  window.location.assign(url);
  return true;
}

/** Drive / connector search may flag login while still returning ok:true. */
export function maybeConnectorLogin(result: { loginRequired?: boolean; loginUrl?: string }): boolean {
  if (!result.loginRequired || !result.loginUrl) return false;
  return redirectToLoginIfRequired({
    ok: false,
    data: null,
    loginRequired: true,
    loginUrl: result.loginUrl,
  });
}
