export type PosterMood = "sit" | "night" | "friends" | "lights";

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
  if (variation === "mood" || variation === "background") return "night";
  if (variation === "style") return "lights";
  if (variation === "text") return "friends";
  return "sit";
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
  const mood = input.mood ?? "sit";
  const lines = clipLines(input.hook, 12, 2);
  const meta = [input.eventName, input.schedule, input.location].filter(Boolean).join(" · ");
  const bg = mood === "night" ? "#1C2422" : mood === "lights" ? "#141A18" : "#F6F1E8";
  const fg = mood === "night" || mood === "lights" ? "#F6F1E8" : "#1C2422";
  const paper = mood === "night" || mood === "lights" ? "rgba(246,241,232,.92)" : "#FFFCF8";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xmlText(lines.join(" "))}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <circle cx="${mood === "friends" ? 280 : 220}" cy="420" r="240" fill="#7EB8C9" opacity="${mood === "lights" ? ".7" : ".35"}"/>
  <circle cx="540" cy="340" r="210" fill="#E0B07A" opacity="${mood === "lights" ? ".62" : ".32"}"/>
  <circle cx="860" cy="460" r="250" fill="#D9A3A3" opacity="${mood === "lights" ? ".58" : ".3"}"/>
  ${mood === "sit" || mood === "friends" ? `<ellipse cx="540" cy="980" rx="320" ry="70" fill="#E7DCC8"/><ellipse cx="540" cy="820" rx="200" ry="72" fill="#2F5F56"/><ellipse cx="540" cy="792" rx="148" ry="42" fill="#F6F1E8"/>` : ""}
  ${mood === "night" ? `<rect y="760" width="${width}" height="590" fill="#2F5F56"/><path d="M0 820 C 200 740, 400 900, 540 820 S 900 740, 1080 820 L 1080 1350 L 0 1350 Z" fill="#3F7A6E"/>` : ""}
  ${mood === "friends" ? `<circle cx="430" cy="760" r="54" fill="#2F5F56"/><circle cx="650" cy="760" r="54" fill="#2F5F56"/><circle cx="418" cy="748" r="8" fill="#F6F1E8"/><circle cx="662" cy="748" r="8" fill="#F6F1E8"/>` : ""}
  <rect x="72" y="${height - 430}" width="${width - 144}" height="300" rx="36" fill="${paper}"/>
  <text x="540" y="${height - 300}" text-anchor="middle" font-family="Noto Serif TC, Georgia, serif" font-size="64" fill="#1C2422">${xmlText(lines[0] ?? "")}</text>
  ${lines[1] ? `<text x="540" y="${height - 220}" text-anchor="middle" font-family="Noto Serif TC, Georgia, serif" font-size="64" fill="#1C2422">${xmlText(lines[1])}</text>` : ""}
  <text x="540" y="${height - 150}" text-anchor="middle" font-family="Noto Sans TC, sans-serif" font-size="28" fill="#2F5F56">${xmlText(meta || "人到了就好")}</text>
  <circle cx="140" cy="120" r="18" fill="#7EB8C9"/><circle cx="190" cy="120" r="18" fill="#E0B07A"/><circle cx="240" cy="120" r="18" fill="#D9A3A3"/>
  <text x="90" y="80" font-family="Noto Sans TC, sans-serif" font-size="22" fill="${fg}" opacity=".7">淡江禪學社</text>
</svg>`;
}

export function posterDataUrl(input: Parameters<typeof composePosterSvg>[0]) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(composePosterSvg(input))}`;
}
