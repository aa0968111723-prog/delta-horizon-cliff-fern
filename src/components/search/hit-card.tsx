import { Button } from "@/components/ui/button";
import { hitActionLabel } from "@/lib/zen/from-hit";
import type { SearchHit } from "@/lib/zen/search";

export function SearchHitCard({
  hit,
  busy,
  onCreate,
}: {
  hit: SearchHit;
  busy?: boolean;
  onCreate: (hit: SearchHit) => void;
}) {
  return (
    <li className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-sm font-medium">{hit.title}</p>
      <p className="text-xs text-muted">{hit.subtitle}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => onCreate(hit)}>
          {hitActionLabel(hit)}
        </Button>
        {hit.url ? (
          <Button size="sm" variant="ghost" asChild>
            <a href={hit.url} target={hit.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {hit.source === "canva" ? "打開 Canva" : hit.source === "campaign" ? "打開活動" : "打開"}
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
