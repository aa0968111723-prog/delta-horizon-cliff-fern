export function driveSearchQuery(query: string, folderName?: string) {
  const folder = folderName?.trim();
  if (!folder || query.includes(folder)) return query.trim();
  return `${folder} ${query}`.trim();
}

export function folderSearchInput(query: string, folder?: { driveFolder?: string; driveFolderId?: string }) {
  const folderName = folder?.driveFolder?.trim() || undefined;
  const folderId = folder?.driveFolderId?.trim() || undefined;
  return {
    query,
    ...(folderName ? { folderName } : {}),
    ...(folderId ? { folderId } : {}),
  };
}

export function canvaDesignsUrl(query?: string) {
  const url = new URL("https://api.canva.com/rest/v1/designs");
  url.searchParams.set("limit", "24");
  const q = query?.trim();
  if (q) {
    url.searchParams.set("query", q.slice(0, 80));
    url.searchParams.set("sort_by", "relevance");
  }
  return url.toString();
}

export function canvaPresetFor(kind: string) {
  if (kind === "story") return "instagramStory";
  if (kind === "reels") return "instagramReel";
  return "instagramPost";
}

export function canvaDesignTypeFor(kind: string) {
  if (kind === "story" || kind === "reels") return { type: "custom" as const, width: 1080, height: 1920 };
  if (kind === "line") return { type: "custom" as const, width: 1040, height: 1040 };
  if (kind === "threads") return { type: "custom" as const, width: 1080, height: 1080 };
  return { type: "custom" as const, width: 1080, height: 1350 };
}

export function canvaUploadName(title: string, kind: string) {
  const raw = `${title}-${kind}`.replace(/\s+/g, " ").trim().slice(0, 44) || "zen-club";
  return `${raw}.jpg`;
}

export function canvaMetadataHeader(filename: string) {
  const name = filename.slice(0, 50);
  const bytes = new TextEncoder().encode(name);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return JSON.stringify({ name_base64: btoa(binary) });
}

export function jpegBase64Payload(raw: string) {
  const trimmed = raw.trim();
  const match = trimmed.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (match) return { mime: match[1].toLowerCase(), base64: match[2].replace(/\s/g, "") };
  if (/^\/9j\//.test(trimmed)) return { mime: "image/jpeg" as const, base64: trimmed };
  return null;
}

export function canvaJobId(json: { job?: { id?: string } }) {
  return json.job?.id || "";
}

export function canvaJobAssetId(json: { job?: { status?: string; asset?: { id?: string } } }) {
  if (json.job?.status === "failed") return "";
  return json.job?.asset?.id || "";
}

export function canvaJobExportUrl(json: { job?: { status?: string; urls?: string[] } }) {
  if (json.job?.status === "failed") return "";
  return json.job?.urls?.find((url) => /^https:\/\//.test(url)) || "";
}
