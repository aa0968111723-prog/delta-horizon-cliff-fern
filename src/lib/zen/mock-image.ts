export type MockImageAspect = "4:5" | "1:1" | "9:16";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sizeFor(aspect: MockImageAspect) {
  if (aspect === "9:16") return { w: 1080, h: 1920 };
  if (aspect === "1:1") return { w: 1080, h: 1080 };
  return { w: 1080, h: 1350 };
}

export function mockStudioSvg(input: {
  prompt: string;
  aspect?: MockImageAspect;
  headline?: string;
  subhead?: string;
}): string {
  const aspect = input.aspect ?? "4:5";
  const { w, h } = sizeFor(aspect);
  const tea = /茶/.test(input.prompt);
  const light = /浮游|禪光|燈/.test(input.prompt);
  const headline = (input.headline || (tea ? "來坐一下\n不用先懂禪" : "最近是不是\n很久沒坐好")).slice(0, 40);
  const lines = headline.split(/\n/).filter(Boolean).slice(0, 3);
  const sub = esc((input.subhead || (tea ? "茶會 · 淡水校園" : light ? "浮游禪光" : "淡江禪學社")).slice(0, 28));
  const y0 = Math.round(h * 0.48);
  const text = lines
    .map((line, i) => `<tspan x="96" dy="${i === 0 ? 0 : 92}">${esc(line)}</tspan>`)
    .join("");
  const turtle = `
    <g opacity="0.55">
      <ellipse cx="${w - 210}" cy="${h - 260}" rx="78" ry="52" fill="#2f6a4a"/>
      <ellipse cx="${w - 210}" cy="${h - 268}" rx="46" ry="28" fill="#3f6f64"/>
      <circle cx="${w - 278}" cy="${h - 248}" r="18" fill="#2f6a4a"/>
    </g>`;
  const orbs = `
    <circle cx="${w * 0.28}" cy="${h * 0.28}" r="70" fill="#7ec8c3" opacity="0.45"/>
    <circle cx="${w * 0.46}" cy="${h * 0.22}" r="42" fill="#e8a060" opacity="0.55"/>
    <circle cx="${w * 0.38}" cy="${h * 0.36}" r="28" fill="#d98aa0" opacity="0.5"/>`;
  const cup = tea
    ? `<ellipse cx="280" cy="${h * 0.48}" rx="90" ry="28" fill="#fffcf7" opacity="0.35"/><ellipse cx="280" cy="${h * 0.47}" rx="54" ry="16" fill="#e8a060" opacity="0.4"/>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1c2422"/>
      <stop offset="55%" stop-color="#5b6e8a"/>
      <stop offset="100%" stop-color="#3f6f64"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <ellipse cx="${w * 0.5}" cy="${h + 40}" rx="${w * 0.7}" ry="${h * 0.22}" fill="#1c2422" opacity="0.45"/>
  ${orbs}
  ${cup}
  ${turtle}
  <text x="96" y="${y0}" fill="#fffcf7" font-size="72" font-family="Noto Serif TC, serif" font-weight="600">${text}</text>
  <text x="96" y="${h - 88}" fill="#e4ebe6" font-size="28" font-family="Noto Sans TC, sans-serif">${sub}</text>
</svg>`;
}

export function mockStudioDataUrl(input: {
  prompt: string;
  aspect?: MockImageAspect;
  headline?: string;
  subhead?: string;
}) {
  const svg = mockStudioSvg(input);
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
