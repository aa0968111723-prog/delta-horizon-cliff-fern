import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { searchDriveLive } from "@/lib/connect/sync";
import { searchCreative, groupCreativeHits, type CreativeHit } from "@/lib/zen/search";
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
  const upsertRemoteFiles = useStudio((s) => s.upsertRemoteFiles);
  const [q, setQ] = useState("");
  const [liveNote, setLiveNote] = useState("");

  const hits = useMemo(
    () => searchCreative({ query: q, assets, projects, campaigns, igMemory, remoteFiles }),
    [q, assets, projects, campaigns, igMemory, remoteFiles],
  );

  const groups = useMemo(() => groupCreativeHits(hits), [hits]);
  const urls = useAssetUrls(hits.map((hit) => hit.assetId).filter((id): id is string => Boolean(id)));

  useEffect(() => {
    if (!open) return;
    const query = q.trim().slice(0, 80);
    if (query.length < 2) {
      setLiveNote("");
      return;
    }
    const timer = window.setTimeout(() => {
      void searchDriveLive({ data: { query } })
        .then((live) => {
          if (live.files.length) upsertRemoteFiles(live.files);
          setLiveNote(live.note);
        })
        .catch(() => undefined);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [q, open, upsertRemoteFiles]);

  function openHit(hit: CreativeHit, action: "create" | "source") {
    if (action === "source" && hit.url) {
      window.open(hit.url, "_blank", "noopener,noreferrer");
      return;
    }
    setSearchOpen(false);
    if (hit.projectId) {
      void navigate({ to: "/studio/$projectId", params: { projectId: hit.projectId } });
      return;
    }
    if (hit.campaignId) {
      void navigate({ to: "/create", search: { mode: "campaign", idea: hit.title } });
      return;
    }
    const idea = hit.title;
    if (hit.source === "canva") {
      void navigate({ to: "/create", search: { mode: "from-canva", idea } });
      return;
    }
    if (hit.source === "drive") {
      void navigate({ to: "/create", search: { mode: "from-drive", idea } });
      return;
    }
    if (hit.source === "instagram") {
      void navigate({ to: "/create", search: { mode: "from-ig", idea } });
      return;
    }
    if (hit.assetId) {
      void navigate({
        to: "/create",
        search: { mode: "from-image", idea, asset: hit.assetId },
      });
      return;
    }
    void navigate({ to: "/create", search: { mode: "idea", idea } });
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
          {liveNote ? <p className="mt-2 text-xs text-subtle">{liveNote}</p> : null}
        </div>
        <div className="max-h-[70dvh] overflow-y-auto p-3">
          {Object.entries(groups).map(([source, list]) => (
            <section key={source} className="mb-4">
              <h3 className="mb-2 text-xs tracking-[0.14em] text-muted uppercase">{sourceLabel(source)}</h3>
              <ul className="space-y-1">
                {list.map((hit) => (
                  <li key={hit.id}>
                    <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                      {hit.thumbnail || (hit.assetId && urls[hit.assetId]) ? (
                        <img src={hit.thumbnail || urls[hit.assetId!]} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="size-10 shrink-0 rounded-lg bg-surface" />
                      )}
                      <button type="button" onClick={() => openHit(hit, "create")} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm">{hit.title}</p>
                        <p className="truncate text-xs text-muted">
                          {sourceLabel(hit.source)} · {hit.subtitle}
                        </p>
                      </button>
                      {hit.url ? (
                        <button
                          type="button"
                          className="shrink-0 text-xs text-muted"
                          onClick={() => openHit(hit, "source")}
                        >
                          開原檔
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {hits.length === 0 ? <p className="py-8 text-center text-sm text-muted">沒有找到。試試活動名或龜龜。</p> : null}
          <p className="px-1 pb-2 text-xs text-subtle">
            也可到{" "}
            <Link to="/connect" className="underline" onClick={() => setSearchOpen(false)}>
              連接
            </Link>{" "}
            把 Drive／Canva／IG 算進來。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function sourceLabel(source: string) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  return "本機創作";
}
