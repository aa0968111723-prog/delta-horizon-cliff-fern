import { groupHits, sourceGroupLabel } from "@/lib/creative/search";
import type { SearchHit } from "@/lib/creative/types";

export function CreativeHits({
  hits,
  onPick,
  onAnalyze,
  pickedIds,
}: {
  hits: SearchHit[];
  onPick?: (hit: SearchHit) => void;
  onAnalyze?: (hit: SearchHit) => void;
  pickedIds?: Set<string>;
}) {
  const groups = groupHits(hits);
  if (!groups.length) return null;
  return (
    <div className="mt-3 space-y-3 rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]">
      {groups.map((group) => (
        <div key={group.source}>
          <p className="text-xs tracking-[0.12em] text-muted uppercase">{sourceGroupLabel(group.source)}</p>
          <ul className="mt-1 space-y-1">
            {group.items.slice(0, 4).map((hit) => (
              <li key={`${hit.source}-${hit.id}`} className="flex items-start gap-2">
                {hit.href && !onPick ? (
                  <a href={hit.href} className="min-w-0 flex-1 rounded-xl px-2 py-1.5 hover:bg-surface-2">
                    <HitBody hit={hit} />
                  </a>
                ) : (
                  <button
                    type="button"
                    className={`min-w-0 flex-1 rounded-xl px-2 py-1.5 text-left hover:bg-surface-2 ${pickedIds?.has(hit.id) ? "bg-surface-2 ring-1 ring-accent/40" : ""}`}
                    onClick={() => onPick?.(hit)}
                  >
                    <HitBody hit={hit} />
                  </button>
                )}
                {hit.href?.startsWith("https:") ? (
                  <a
                    href={hit.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 shrink-0 text-xs text-accent"
                  >
                    開啟
                  </a>
                ) : null}
                {onAnalyze && hit.thumbUrl ? (
                  <button
                    type="button"
                    className="mt-2 shrink-0 text-xs text-accent"
                    onClick={() => onAnalyze(hit)}
                  >
                    風格
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function HitBody({ hit }: { hit: SearchHit }) {
  return (
    <span className="flex gap-3">
      {hit.thumbUrl ? (
        <img src={hit.thumbUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
      ) : null}
      <span className="min-w-0">
        <p className="text-sm font-medium">{hit.title}</p>
        <p className="text-xs text-muted">
          {hit.sourceLabel} · {hit.summary}
        </p>
      </span>
    </span>
  );
}
