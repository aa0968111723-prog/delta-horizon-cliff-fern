import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchCreative } from "@/lib/search/creative";
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
  const [q, setQ] = useState(lastSearch);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState(0);
  const [detail, setDetail] = useState("");
  const [groups, setGroups] = useState<Record<string, SearchHit[]>>({});

  async function run(query: string) {
    setBusy(true);
    try {
      const result = await searchCreative({ data: { query } });
      if (result.loginRequired) maybeConnectorLogin(result);
      setGroups(result.groups);
      setFound(result.found);
      setDetail(result.driveDetail);
      setLastSearch(query);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "搜尋失敗");
    } finally {
      setBusy(false);
    }
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
          />
          <Button type="submit" disabled={busy}>
            <Search className="size-4" />
            搜尋
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted">{busy ? "搜尋中…" : found ? `找到 ${found} 個相關素材。${detail}` : detail}</p>
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        window.sessionStorage.setItem("zen-idea", `${item.title}\n${item.notes}`);
                        setSearchOpen(false);
                      }}
                      asChild
                    >
                      <Link to="/create" search={{ tab: "copy" }}>
                        加入創作
                      </Link>
                    </Button>
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
