import { Link } from "@tanstack/react-router";
import { Images, Instagram, Link2, Palette, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { getConnections } from "@/lib/connections/status";
import type { ConnectionStatus, ProviderId } from "@/lib/connections/providers";
import { matchesAssetQuery } from "@/lib/studio/assets";
import { campaignTitle } from "@/lib/studio/campaign";
import { contentKindLabel } from "@/lib/studio/status";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

/**
 * Global Creative Search：一個搜尋框，同時找素材庫、AI 生成、內容與活動，
 * 之後接上 Drive / Canva / Instagram 也在同一個框裡出結果，分類顯示。
 */
export function CreativeSearchPage({ initialQuery }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery ?? "");
  const assets = useStudio((s) => s.assets);
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);

  useEffect(() => {
    let alive = true;
    void getConnections().then((list) => {
      if (alive) setConnections(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const query = q.trim();

  const assetHits = useMemo(
    () => (query ? assets.filter((a) => matchesAssetQuery(a, query)) : assets.slice(0, 12)),
    [assets, query],
  );
  const generatedHits = useMemo(() => assetHits.filter((a) => a.source === "generated"), [assetHits]);
  const libraryHits = useMemo(() => assetHits.filter((a) => a.source !== "generated"), [assetHits]);

  const contentHits = useMemo(() => {
    if (!query) return projects.slice(0, 6);
    const n = query.toLowerCase();
    return projects.filter((p) =>
      [p.name, p.copy.caption, p.copy.headline, p.brief.eventName, ...p.copy.hashtags]
        .join(" ")
        .toLowerCase()
        .includes(n),
    );
  }, [projects, query]);

  const campaignHits = useMemo(() => {
    if (!query) return campaigns.slice(0, 4);
    const n = query.toLowerCase();
    return campaigns.filter((c) =>
      [c.name, c.oneLiner, c.intro, c.theme, c.location].join(" ").toLowerCase().includes(n),
    );
  }, [campaigns, query]);

  const total = generatedHits.length + libraryHits.length + contentHits.length + campaignHits.length;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="搜尋"
        title="找素材與過去的內容"
        description="一個框就好。不用分別去每個 App 找。"
      />

      <div className="mt-6 flex items-center gap-2 rounded-2xl bg-surface px-3 shadow-[var(--shadow-border)]">
        <Search className="size-4 shrink-0 text-subtle" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例：以前晚上的茶會照片／有龜龜的素材／浮游禪光"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {query ? (
        <p className="mt-3 text-xs text-muted">找到 {total} 個相關項目</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {["浮游禪光", "茶會", "龜龜", "淡水", "夜晚", "社課"].map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => setQ(tag)}
                className="min-h-9 rounded-full bg-surface-2 px-3 text-xs text-muted hover:text-fg"
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Group title="素材庫" count={libraryHits.length} icon={Images}>
        {libraryHits.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {libraryHits.slice(0, 15).map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                <Link to="/assets" className="block">
                  <span className="block aspect-square bg-surface-2">
                    {urls[asset.id] ? (
                      <img src={urls[asset.id]} alt={asset.name} className="size-full object-cover" />
                    ) : null}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs">{asset.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="素材庫裡沒有符合的東西。" />
        )}
      </Group>

      <Group title="AI 生成" count={generatedHits.length} icon={Sparkles}>
        {generatedHits.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {generatedHits.slice(0, 10).map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                <Link to="/assets" className="block">
                  <span className="block aspect-square bg-surface-2">
                    {urls[asset.id] ? (
                      <img src={urls[asset.id]} alt={asset.name} className="size-full object-cover" />
                    ) : null}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs">{asset.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="還沒有 AI 生成的圖片。" />
        )}
      </Group>

      <Group title="做過的內容" count={contentHits.length} icon={Instagram}>
        {contentHits.length ? (
          <ul className="space-y-2">
            {contentHits.slice(0, 8).map((project) => (
              <li key={project.id}>
                <Link
                  to="/studio/$projectId"
                  params={{ projectId: project.id }}
                  className="block rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]"
                >
                  <span className="block truncate text-sm font-medium">{project.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {contentKindLabel(project.contentKind)}
                    {project.copy.caption ? ` · ${project.copy.caption.slice(0, 40)}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="沒有符合的內容。" />
        )}
      </Group>

      <Group title="活動" count={campaignHits.length} icon={Palette}>
        {campaignHits.length ? (
          <ul className="space-y-2">
            {campaignHits.map((campaign) => (
              <li key={campaign.id}>
                <Link
                  to="/campaigns/$campaignId"
                  params={{ campaignId: campaign.id }}
                  className="block rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]"
                >
                  <span className="block truncate text-sm font-medium">{campaignTitle(campaign)}</span>
                  <span className="block truncate text-xs text-muted">{campaign.oneLiner}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="沒有符合的活動。" />
        )}
      </Group>

      {/* 尚未連接的來源，誠實列出來 */}
      {connections.filter((c) => c.state !== "connected").length ? (
        <section className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">還沒接進搜尋的來源</p>
          <ul className="mt-2 space-y-2">
            {connections
              .filter((c) => c.state !== "connected")
              .map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    {c.name}：{c.state === "unconfigured" ? "尚未設定憑證" : "待授權"}
                  </span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/connections" search={{ focus: c.id as ProviderId }}>
                      <Link2 className="size-3.5" />
                      去連接
                    </Link>
                  </Button>
                </li>
              ))}
          </ul>
          <p className="mt-2 text-xs text-subtle">
            連上之後，這一個搜尋框就會同時找 Google Drive、Canva 與 Instagram，並分類顯示。
          </p>
        </section>
      ) : null}
    </main>
  );
}

function Group({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  icon: typeof Images;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-subtle" />
        <h2 className="text-sm font-medium">{title}</h2>
        <span className={cn("text-xs", count ? "text-muted" : "text-subtle")}>{count}</span>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-surface px-4 py-5 text-center text-xs text-subtle shadow-[var(--shadow-border)]">{text}</p>;
}
