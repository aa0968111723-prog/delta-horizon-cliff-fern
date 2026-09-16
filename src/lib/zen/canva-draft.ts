export type CanvaPreset = "instagramPost" | "instagramStory" | "instagramReel";

export function canvaDraftTitle(name: string, hook?: string) {
  const raw = hook?.trim() ? `${name.trim()}｜${hook.trim()}` : name.trim();
  return raw.slice(0, 50);
}

export function canvaPresetForKind(kind: string): CanvaPreset {
  if (kind === "story" || kind === "day-of") return "instagramStory";
  if (kind === "reels") return "instagramReel";
  return "instagramPost";
}

export function canvaDraftNotes(input: {
  hook?: string;
  body?: string;
  cta?: string;
  hashtags?: string[];
  signupUrl?: string;
}) {
  return [
    input.hook,
    input.body,
    input.cta,
    input.signupUrl ? `報名 ${input.signupUrl}` : "",
    (input.hashtags ?? []).join(" "),
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
