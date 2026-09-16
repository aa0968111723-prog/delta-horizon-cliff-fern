import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { writeHandoff } from "@/lib/create/handoff";
import { searchCreative } from "@/lib/search/creative";
import { adoptIdeaFromHit } from "@/lib/search/hits";
import { canvaOpenUrl, styleBriefFromReport, styleReportFromHit } from "@/lib/vision/from-hit";
import { folderSearchInput } from "@/lib/connections/presets";
import { sourceLabel } from "@/stores/creative-store";
import { useCreative } from "@/stores/creative-store";
import { useUi } from "@/stores/ui-store";
import { maybeConnectorLogin } from "@/lib/app-data/login";
import type { SearchHit } from "@/lib/search/creative";

export function CreativeSearch() {
  const open = useUi((s) => s.searchOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const lastSearch = useCreative((s) => s.lastSearch);
  const setLastSearch = useCreative((s) => s.setLastSearch);
  const rememberStyle = useCreative((s) => s.rememberStyle);
  const folder = useCreative((s) => s.folder);
  const [q, setQ] = useState(lastSearch);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState(0);
  const [detail, setDetail] = useState("");
  const [groups, setGroups] = useState<Record<string, SearchHit[]>>({});
  const [driveLoginUrl, setDriveLoginUrl] = useState<string | undefined>();

  async function run(query: string) {
    setBusy(true);
    try {
      const result = await searchCreative({ data: folderSearchInput(query, folder) });
      setGroups(result.groups);
      setFound(result.found);
      setDetail(result.driveDetail);
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
        <p className="mt-2 text-xs text-muted" data-testid="creative-search-found">{busy ? "搜尋中…" : found ? `找到 ${found} 個相關素材。${detail}` : detail}</p>
        {driveLoginUrl ? (
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => maybeConnectorLogin({ loginRequired: true, loginUrl: driveLoginUrl })}
          >
            連接 Google Drive 再搜一次
          </Button>
        ) : null}
        {Object.entries(groups).map(([key, list]) =>
          list.length ? (
            <section key={key} className="mt-4">
              <h3 className="text-xs tracking-wide text-muted uppercase">{sourceLabel(key as never) || key}</h3>
              <ul className="mt-2 space-y-2">
                {list.map((item) => (
                  <li key={item.id} className="flex gap-3 rounded-xl bg-surface-2 p-2">
                    <img src={item.thumb} alt="" className="size-14 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted">{item.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid="search-add-create"
                      onClick={() => {
                        rememberStyle(styleBriefFromReport(styleReportFromHit(item), sourceLabel(item.source)));
                        writeHandoff({
                          idea: adoptIdeaFromHit(item),
                          tab: "campaign",
                          autoRun: true,
                          convertKind: item.kind !== "asset" ? item.kind : undefined,
                          sourceLabel: `${sourceLabel(item.source)} / ${item.title}`,
                        });
                        setSearchOpen(false);
                      }}
                      asChild
                    >
                      <Link to="/create" search={{ tab: "campaign" }}>
                        加入創作
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid="search-analyze"
                      onClick={() => {
                        rememberStyle(styleBriefFromReport(styleReportFromHit(item), sourceLabel(item.source)));
                        writeHandoff({
                          idea: item.title,
                          tab: "vision",
                          imageSrc: item.thumb,
                          visionNote: `${item.subtitle}。${item.notes}`,
                          sourceLabel: `${sourceLabel(item.source)} / ${item.title}`,
                          autoRun: true,
                        });
                        setSearchOpen(false);
                      }}
                      asChild
                    >
                      <Link to="/create" search={{ tab: "vision" }}>
                        分析
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid="search-style-ref"
                      onClick={() => {
                        rememberStyle(styleBriefFromReport(styleReportFromHit(item), sourceLabel(item.source)));
                        writeHandoff({
                          idea: adoptIdeaFromHit(item),
                          tab: "campaign",
                          autoRun: true,
                          sourceLabel: `風格參考 / ${item.title}`,
                        });
                        setSearchOpen(false);
                      }}
                      asChild
                    >
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
                ))}
              </ul>
            </section>
          ) : null,
        )}
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/connections" onClick={() => setSearchOpen(false)}>
            前往連接
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
