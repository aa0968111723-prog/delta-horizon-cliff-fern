/** Visual QR mark encoded from the payload. Finder patterns are real; data modules are payload-derived. */
export function renderQrSvg(payload: string, dark = "#1A1814", light = "#FFFCF7"): string {
  const n = 25;
  const modules: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));

  function inFinder(x: number, y: number) {
    const boxes = [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ];
    return boxes.some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  }

  function paintFinder(fx: number, fy: number) {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        modules[fy + dy][fx + dx] = edge || core;
      }
    }
  }

  paintFinder(0, 0);
  paintFinder(n - 7, 0);
  paintFinder(0, n - 7);

  for (let i = 8; i < n - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  const bytes = Array.from(payload, (ch) => ch.charCodeAt(0) & 255);
  if (!bytes.length) bytes.push(1);
  let seed = 2166136261;
  for (const b of bytes) seed = Math.imul(seed ^ b, 16777619) >>> 0;

  let i = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y) || x === 6 || y === 6) continue;
      const b = bytes[i % bytes.length];
      const mixed = (b + x * 13 + y * 7 + (seed >>> (x % 16))) & 1;
      modules[y][x] = mixed === 1;
      i += 1;
    }
  }

  const cell = 8;
  const quiet = 16;
  const size = n * cell + quiet * 2;
  const rects: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!modules[y][x]) continue;
      rects.push(`<rect x="${quiet + x * cell}" y="${quiet + y * cell}" width="${cell}" height="${cell}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img"><rect width="100%" height="100%" fill="${light}"/><g fill="${dark}">${rects.join("")}</g></svg>`;
}
