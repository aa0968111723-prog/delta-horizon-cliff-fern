import { createHash, randomBytes } from "node:crypto";

export function createPkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function pkceCookieName(provider: string) {
  return `zen_oauth_pkce_${provider}`;
}
