import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { writeHandoff } from "@/lib/create/handoff";
import { flattenHits, orderedSourceEntries, publishedHits, summarizeFound } from "@/lib/club/compose";
import { searchCreative } from "@/lib/search/creative";
import { adoptIdeaFromHit, localCreativeHits, mergeLocalHits } from "@/lib/search/hits";
import { canvaOpenUrl, styleBriefFromReport, styleReportFromHit } from "@/lib/vision/from-hit";
import { folderSearchInput } from "@/lib/connections/presets";
import { sourceLabel } from "@/stores/creative-store";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";
import { maybeConnectorLogin } from "@/lib/app-data/login";
import type { SearchHit } from "@/lib/search/creative";

function SearchHitRow({
  item,
  onAdopt,
}: {
  item: SearchHit;
  onAdopt: (item: SearchHit, kind: "create" | "vision" | "style") => void;
}) {
  return (
    <li className="flex gap-3 rounded-xl bg-surface-2 p-2">
      {item.thumb ? (
        <img src={item.thumb} alt="" className="size-14 rounded-lg object-cover" />
      ) : (
        <div className="size-14 rounded-lg bg-bg" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted" data-testid={item.source === "instagram" ? "search-ig-source" : undefined}>
          {item.subtitle}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <Button size="sm" variant="ghost" data-testid="search-add-create" onClick={() => onAdopt(item, "create")} asChild>
          <Link to="/create" search={{ tab: "campaign" }}>
            加入創作
          </Link>
        </Button>
        <Button size="sm" variant="ghost" data-testid="search-analyze" onClick={() => onAdopt(item, "vision")} asChild>
          <Link to="/create" search={{ tab: "vision" }}>
            分析
          </Link>
        </Button>
        <Button size="sm" variant="ghost" data-testid="search-style-ref" onClick={() => onAdopt(item, "style")} asChild>
          <Link to="/create" search={{ tab: "campaign" }}>
            風格參考
          </Link>
        </Button>
        {canvaOpenUrl(item) ? (
          <Button size="sm" variant="ghost" asChild>
            <a href={canvaOpenUrl(item)} target="_blank" rel="noreferrer">
              開啟 Canva
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function CreativeSearch() {
  const open = useUi((s) => s.searchOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const lastSearch = useCreative((s) => s.lastSearch);
  const setLastSearch = useCreative((s) => s.setLastSearch);
  const rememberStyle = useCreative((s) => s.rememberStyle);
  const folder = useCreative((s) => s.folder);
  const lastPack = useCreative((s) => s.lastPack);
  const igPosts = useCreative((s) => s.igPosts);
  const assets = useStudio((s) => s.assets);
  const [q, setQ] = useState(lastSearch);
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState<Record<string, SearchHit[]>>({});
  const [driveDetail, setDriveDetail] = useState("");
  const [driveLoginUrl, setDriveLoginUrl] = useState<string | undefined>();

  async function run(query: string) {
    setBusy(true);
    try {
      const result = await searchCreative({ data: folderSearchInput(query, folder) });
      const groups = mergeLocalHits(
        query,
        result.groups,
        localCreativeHits({ assets, lastPack, igPosts }, query),
      );
      setGroups(groups);
      setDriveDetail(result.driveDetail);
      setDriveLoginUrl(result.loginRequired ? result.loginUrl : undefined);
      setLastSearch(query);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "搜尋失敗");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    if (!lastSearch) return;
    setQ(lastSearch);
    void run(lastSearch);
    // Open with a preset query from 快速開始 / 創作選單.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const summary = summarizeFound(groups);
  const published = publishedHits(flattenHits(groups)).slice(0, 3);

  function adopt(item: SearchHit, kind: "create" | "vision" | "style") {
    rememberStyle(styleBriefFromReport(styleReportFromHit(item), sourceLabel(item.source)));
    if (kind === "vision") {
      writeHandoff({
        idea: item.title,
        tab: "vision",
        imageSrc: item.thumb,
        visionNote: `${item.subtitle}。${item.notes}`,
        sourceLabel: `${sourceLabel(item.source)} / ${item.title}`,
        autoRun: true,
      });
    } else {
      writeHandoff({
        idea: adoptIdeaFromHit(item),
        tab: "campaign",
        autoRun: true,
        convertKind: kind === "create" && item.kind !== "asset" ? item.kind : undefined,
        sourceLabel: kind === "style" ? `風格參考 / ${item.title}` : `${sourceLabel(item.source)} / ${item.title}`,
      });
    }
    setSearchOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setSearchOpen}>
      <DialogContent className="max-h-[86dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>跨來源搜尋</DialogTitle>
        </DialogHeader>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(q);
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="浮游禪光、茶會照片、龜龜…"
            autoFocus
            data-testid="creative-search-input"
          />
          <Button type="submit" disabled={busy} data-testid="creative-search-submit">
            <Search className="size-4" />
            搜尋
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted" data-testid="creative-search-found">
          {busy
            ? "搜尋中…"
            : summary.found
              ? `${summary.line}${summary.detail ? `。${summary.detail}` : ""}。${driveDetail}`
              : driveDetail}
        </p>
        {summary.counts.length ? (
          <div className="mt-2 flex flex-wrap gap-1" data-testid="search-sources">
            {summary.counts.map((row) => (
              <Button
                key={row.key}
                type="button"
                size="sm"
                variant="secondary"
                data-testid={`search-source-${row.key}`}
                onClick={() => document.getElementById(`search-group-${row.key}`)?.scrollIntoView({ block: "nearest" })}
              >
                {row.label} {row.n}
              </Button>
            ))}
          </div>
        ) : null}
        {driveLoginUrl ? (
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => maybeConnectorLogin({ loginRequired: true, loginUrl: driveLoginUrl })}
          >
            連接 Google Drive 再搜一次
          </Button>
        ) : null}
        {published.length ? (
          <section className="mt-4 rounded-2xl bg-bg p-3" data-testid="search-published">
            <h3 className="text-xs tracking-wide text-muted">剛發布 · Instagram</h3>
            <ul className="mt-2 space-y-2">
              {published.map((item) => (
                <SearchHitRow key={`pub-${item.id}`} item={item} onAdopt={adopt} />
              ))}
            </ul>
          </section>
        ) : null}
        {orderedSourceEntries(groups).map(([key, list]) => (
          <section key={key} id={`search-group-${key}`} className="mt-4">
            <h3 className="text-xs tracking-wide text-muted uppercase">{sourceLabel(key as never) || key}</h3>
            <ul className="mt-2 space-y-2">
              {list.map((item) => (
                <SearchHitRow key={item.id} item={item} onAdopt={adopt} />
              ))}
            </ul>
          </section>
        ))}
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/connections" onClick={() => setSearchOpen(false)}>
            前往連接
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
