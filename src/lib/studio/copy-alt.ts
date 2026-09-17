export function localAltText(input: { hook?: string; headline?: string } = {}): string {
  const hook = (input.hook ?? input.headline ?? "").trim();
  return hook ? `畫面對應「${hook.slice(0, 40)}」` : "";
}
