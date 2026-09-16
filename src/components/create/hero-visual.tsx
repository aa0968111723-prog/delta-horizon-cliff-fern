export function HeroVisual({
  base64,
  mime,
  headline,
  source = "AI Generated",
}: {
  base64: string;
  mime: string;
  headline?: string;
  source?: string;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-artboard)]" data-testid="hero-visual">
      <img
        alt={headline ? `主視覺：${headline}` : "主視覺"}
        src={`data:${mime};base64,${base64}`}
        className="mx-auto h-auto w-full max-w-sm"
      />
      <figcaption className="px-4 py-3 text-xs text-muted">
        主視覺 · 來源：{source}
      </figcaption>
    </figure>
  );
}
