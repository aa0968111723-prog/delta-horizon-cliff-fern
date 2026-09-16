export const OAUTH_RESUME_KEY = "zen-oauth-resume";

export type OAuthResume = "canva-push" | "ig-publish";
export type OAuthNext = "create" | "connections" | "instagram";

const memory = {
  used: false,
  action: null as OAuthResume | null,
};

export function parseOAuthNext(next?: string | null): OAuthNext {
  if (next === "create" || next === "instagram") return next;
  return "connections";
}

export function oauthPath(next?: string | null) {
  const parsed = parseOAuthNext(next);
  if (parsed === "create") return "/create?tab=campaign";
  if (parsed === "instagram") return "/instagram";
  return "/connections";
}

function asResume(value: string | null | undefined): OAuthResume | null {
  if (value === "canva-push" || value === "ig-publish") return value;
  return null;
}

export function writeOAuthResume(action: OAuthResume) {
  memory.used = false;
  memory.action = action;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(OAUTH_RESUME_KEY, action);
  }
}

export function takeOAuthResume(expected: OAuthResume) {
  if (memory.used) return false;
  let action = memory.action;
  if (typeof window !== "undefined") {
    const stored = asResume(window.sessionStorage.getItem(OAUTH_RESUME_KEY));
    if (stored) action = stored;
    window.sessionStorage.removeItem(OAUTH_RESUME_KEY);
  }
  if (action !== expected) {
    if (action && typeof window !== "undefined") {
      window.sessionStorage.setItem(OAUTH_RESUME_KEY, action);
    }
    return false;
  }
  memory.used = true;
  memory.action = null;
  return true;
}
