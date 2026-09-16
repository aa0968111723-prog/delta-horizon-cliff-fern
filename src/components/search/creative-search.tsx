import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchCreative, type CreativeHit } from "@/lib/zen/search";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function CreativeSearch() {
  const navigate = useNavigate();
  const open = useUi((s) => s.searchOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const assets = useStudio((s) => s.assets);
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const igMemory = useStudio((s) => s.igMemory);
  const remoteFiles = useStudio((s) => s.remoteFiles);
  const [q, setQ] = useState("");

  const hits = useMemo(
    () => searchCreative({ query: q, assets, projects, campaigns, igMemory, remoteFiles }),
    [q, assets, projects, campaigns, igMemory, remoteFiles],
  );

  const groups = groupHits(hits);

  function openHit(hit: CreativeHit) {
    setSearchOpen(false);
    if (hit.projectId) {
      void navigate({ to: "/studio/$projectId", params: { projectId: hit.projectId } });
      return;
    }
    if (hit.campaignId) {
      void navigate({ to: "/create", search: { mode: "campaign", idea: hit.title } });
      return;
    }
    if (hit.assetId) {
      void navigate({ to: "/create", search: { mode: "from-image", idea: hit.title } });
      return;
    }
    void navigate({ to: "/create", search: { mode: "idea", idea: hit.title } });
  }

  return (
    <Dialog open={open} onOpenChange={setSearchOpen}>
      <DialogContent className="max-h-[88dvh] overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">跨來源搜尋</DialogTitle>
        <div className="border-b border-border p-3">
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="浮游禪光、茶會、龜龜、晚上的照片…"
          />
        </div>
        <div className="max-h-[70dvh] overflow-y-auto p-3">
          {Object.entries(groups).map(([source, list]) => (
            <section key={source} className="mb-4">
              <h3 className="mb-2 text-xs tracking-[0.14em] text-muted uppercase">{sourceLabel(source)}</h3>
              <ul className="space-y-1">
                {list.map((hit) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onClick={() => openHit(hit)}
                      className="w-full rounded-xl px-3 py-2 text-left hover:bg-surface-2"
                    >
                      <p className="truncate text-sm">{hit.title}</p>
                      <p className="truncate text-xs text-muted">
                        {sourceLabel(hit.source)} · {hit.subtitle}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {hits.length === 0 ? <p className="py-8 text-center text-sm text-muted">沒有找到。試試活動名或龜龜。</p> : null}
          <p className="px-1 pb-2 text-xs text-subtle">
            也可到 <Link to="/connect" className="underline" onClick={() => setSearchOpen(false)}>連接</Link> 把 Drive／Canva／IG 算進來。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function groupHits(hits: CreativeHit[]) {
  const map: Record<string, CreativeHit[]> = {};
  for (const hit of hits) {
    (map[hit.source] ??= []).push(hit);
  }
  return map;
}

function sourceLabel(source: string) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  return "本機創作";
}
