export type PosterMood = "sit" | "night" | "friends" | "lights" | "split" | "tamsui";

export function xmlText(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function clipLines(text: string, maxChars = 12, maxLines = 2) {
  const raw = text.replace(/\s+/g, " ").trim() || "來坐一下";
  const lines: string[] = [];
  let rest = raw;
  while (rest && lines.length < maxLines) {
    lines.push(rest.slice(0, maxChars));
    rest = rest.slice(maxChars);
  }
  return lines;
}

export function moodFromVariation(variation?: string): PosterMood {
  if (variation === "compose") return "split";
  if (variation === "mood") return "night";
  if (variation === "background") return "tamsui";
  if (variation === "style") return "lights";
  if (variation === "text") return "friends";
  return "sit";
}

export function variationForFormat(formatId?: string) {
  if (formatId === "story") return "mood";
  if (formatId === "reels-cover") return "style";
  if (formatId === "threads" || formatId === "line-promo") return "text";
  if (formatId === "feed-square") return "compose";
  return "regen";
}

export function composePosterSvg(input: {
  hook: string;
  eventName?: string;
  schedule?: string;
  location?: string;
  mood?: PosterMood;
  width?: number;
  height?: number;
}) {
  const width = input.width ?? 1080;
  const height = input.height ?? 1350;
  const cx = width / 2;
  const glowY = height * 0.26;
  const sitY = Math.min(height * 0.62, height - 420);
  const cardH = Math.min(300, Math.max(220, height * 0.22));
  const cardY = height - cardH - Math.min(130, height * 0.07);
  const mood = input.mood ?? "sit";
  const lines = clipLines(input.hook, 12, 2);
  const meta = [input.eventName, input.schedule, input.location].filter(Boolean).join(" · ");
  const dark = mood === "night" || mood === "lights" || mood === "tamsui";
  const bg = mood === "night" ? "#1C2422" : mood === "lights" ? "#141A18" : mood === "tamsui" ? "#15201E" : mood === "split" ? "#F6F1E8" : "#F6F1E8";
  const fg = dark || mood === "split" ? "#F6F1E8" : "#1C2422";
  const paper = dark ? "rgba(246,241,232,.92)" : "#FFFCF8";
  const splitW = Math.round(width * 0.46);
  const typeX = mood === "split" ? splitW / 2 : cx;
  const typeY = mood === "split" ? height * 0.42 : cardY + cardH * 0.42;
  const typeFill = mood === "split" ? "#F6F1E8" : "#1C2422";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" data-mood="${mood}" aria-label="${xmlText(lines.join(" "))}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  ${mood === "split" ? `<rect width="${splitW}" height="${height}" fill="#1C2422"/>` : ""}
  <circle cx="${mood === "split" ? width * 0.72 : mood === "friends" ? width * 0.26 : width * 0.2}" cy="${glowY + 80}" r="${width * 0.22}" fill="#7EB8C9" opacity="${mood === "lights" ? ".7" : ".35"}"/>
  <circle cx="${mood === "split" ? width * 0.78 : cx}" cy="${glowY}" r="${width * 0.2}" fill="#E0B07A" opacity="${mood === "lights" ? ".62" : ".32"}"/>
  <circle cx="${mood === "split" ? width * 0.88 : width * 0.8}" cy="${glowY + 120}" r="${width * 0.23}" fill="#D9A3A3" opacity="${mood === "lights" ? ".58" : ".3"}"/>
  ${mood === "sit" || mood === "friends" ? `<ellipse cx="${cx}" cy="${sitY + 160}" rx="${width * 0.3}" ry="${height * 0.05}" fill="#E7DCC8"/><ellipse cx="${cx}" cy="${sitY}" rx="${width * 0.18}" ry="${height * 0.05}" fill="#2F5F56"/><ellipse cx="${cx}" cy="${sitY - 28}" rx="${width * 0.14}" ry="${height * 0.03}" fill="#F6F1E8"/>` : ""}
  ${mood === "night" ? `<rect y="${height * 0.4}" width="${width}" height="${height * 0.6}" fill="#2F5F56"/><path d="M0 ${height * 0.43} C ${width * 0.18} ${height * 0.38}, ${width * 0.37} ${height * 0.47}, ${cx} ${height * 0.43} S ${width * 0.83} ${height * 0.38}, ${width} ${height * 0.43} L ${width} ${height} L 0 ${height} Z" fill="#3F7A6E"/>` : ""}
  ${mood === "tamsui" ? `<rect y="${height * 0.58}" width="${width}" height="${height * 0.42}" fill="#1C2422"/><rect x="${width * 0.08}" y="${height * 0.46}" width="${width * 0.1}" height="${height * 0.14}" fill="#2F5F56"/><rect x="${width * 0.22}" y="${height * 0.5}" width="${width * 0.14}" height="${height * 0.1}" fill="#3F7A6E"/><rect x="${width * 0.4}" y="${height * 0.44}" width="${width * 0.08}" height="${height * 0.16}" fill="#2F5F56"/><path d="M0 ${height * 0.62} C ${width * 0.3} ${height * 0.58}, ${width * 0.6} ${height * 0.66}, ${width} ${height * 0.6} L ${width} ${height} L 0 ${height} Z" fill="#243834"/>` : ""}
  ${mood === "friends" ? `<circle cx="${cx - 110}" cy="${sitY - 60}" r="54" fill="#2F5F56"/><circle cx="${cx + 110}" cy="${sitY - 60}" r="54" fill="#2F5F56"/><circle cx="${cx - 122}" cy="${sitY - 72}" r="8" fill="#F6F1E8"/><circle cx="${cx + 122}" cy="${sitY - 72}" r="8" fill="#F6F1E8"/>` : ""}
  ${mood === "split" ? "" : `<rect x="72" y="${cardY}" width="${width - 144}" height="${cardH}" rx="36" fill="${paper}"/>`}
  <text x="${typeX}" y="${typeY}" text-anchor="middle" font-family="Noto Serif TC, Georgia, serif" font-size="${mood === "split" ? 52 : 64}" fill="${typeFill}">${xmlText(lines[0] ?? "")}</text>
  ${lines[1] ? `<text x="${typeX}" y="${typeY + (mood === "split" ? 72 : cardH * 0.26)}" text-anchor="middle" font-family="Noto Serif TC, Georgia, serif" font-size="${mood === "split" ? 52 : 64}" fill="${typeFill}">${xmlText(lines[1])}</text>` : ""}
  <text x="${typeX}" y="${mood === "split" ? height * 0.62 : cardY + cardH * 0.88}" text-anchor="middle" font-family="Noto Sans TC, sans-serif" font-size="28" fill="${mood === "split" ? "#D9A3A3" : "#2F5F56"}">${xmlText(meta || "人到了就好")}</text>
  <circle cx="140" cy="120" r="18" fill="#7EB8C9"/><circle cx="190" cy="120" r="18" fill="#E0B07A"/><circle cx="240" cy="120" r="18" fill="#D9A3A3"/>
  <text x="90" y="80" font-family="Noto Sans TC, sans-serif" font-size="22" fill="${fg}" opacity=".7">淡江禪學社</text>
</svg>`;
}

export function posterDataUrl(input: Parameters<typeof composePosterSvg>[0]) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(composePosterSvg(input))}`;
}
