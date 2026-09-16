export function publicImageUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname === "localhost" || url.hostname.endsWith(".local") || url.hostname === "127.0.0.1") return null;
    return value;
  } catch {
    return null;
  }
}

export function captionForInstagram(text: string) {
  return text.trim().slice(0, 2200);
}
