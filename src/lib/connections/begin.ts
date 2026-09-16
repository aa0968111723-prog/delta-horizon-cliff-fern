import { startOAuth } from "./oauth";
import { writeOAuthResume, type OAuthNext, type OAuthResume } from "./resume";

export async function beginOAuth(input: {
  provider: "canva" | "instagram";
  next: OAuthNext;
  resume?: OAuthResume;
}) {
  const result = await startOAuth({ data: { provider: input.provider, next: input.next } });
  if (!result.ok) return result;
  if (input.resume) writeOAuthResume(input.resume);
  if (typeof window !== "undefined") window.location.assign(result.url);
  return result;
}
