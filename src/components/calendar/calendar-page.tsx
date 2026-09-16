import { Link } from "@tanstack/react-router";
import { CalendarDays, Instagram, Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CampaignEditorDialog } from "@/components/campaigns/campaign-editor";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAMPAIGN_TYPE_LABELS,
  CONTENT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  type Campaign,
  type ContentStatus,
} from "@/lib/studio/campaign-types";
import { useCampaignStore } from "@/lib/studio/campaign-store";

export function CalendarPage({
  onOpenAi,
}: {
  onOpenAi?: (topic: string, campaign?: Campaign) => void;
}) {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const posts = useCampaignStore((s) => s.scheduledPosts);
  const setPostStatus = useCampaignStore((s) => s.setPostStatus);
  const deleteScheduledPost = useCampaignStore((s) => s.deleteScheduledPost);
  const selectCampaign = useCampaignStore((s) => s.selectCampaign);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ContentStatus>("all");

  const grouped = useMemo(() => {
    const filtered = posts.filter((p) => statusFilter === "all" || p.status === statusFilter);
    const map = new Map<string, typeof posts>();
    for (const post of filtered) {
      const day = post.scheduledAt.slice(0, 10) || "未排期";
      const list = map.get(day) ?? [];
      list.push(post);
      map.set(day, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [posts, statusFilter]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="內容日曆"
        title="活動與發文節奏"
        description="一人網宣把茶會、社課與 IG 排程放在同一張表。生成後可直接進畫布。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/instagram">
                <Instagram className="size-4" />
                IG 九宮格
              </Link>
            </Button>
            <Button
              size="sm"
              data-testid="create-campaign"
              onClick={() => {
                setEditId(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="size-4" />
              建立活動
            </Button>
          </div>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">社團活動</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {campaigns.map((camp) => (
            <li key={camp.id} className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="accent">{CAMPAIGN_TYPE_LABELS[camp.type]}</Badge>
                <span className="text-xs text-muted">{camp.date}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold">{camp.name}</h3>
              <p className="mt-1 text-sm text-muted">{camp.oneLiner}</p>
              <p className="mt-2 text-xs text-subtle">
                {camp.time} · {camp.location}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    selectCampaign(camp.id);
                    onOpenAi?.(`${camp.name} 完整宣傳波段`, camp);
                  }}
                >
                  <Sparkles className="size-4" />
                  生成宣傳波段
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditId(camp.id);
                    setEditorOpen(true);
                  }}
                >
                  編輯
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <CalendarDays className="size-4 text-accent" />
            排程表
          </h2>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              {(Object.keys(CONTENT_STATUS_LABELS) as ContentStatus[]).map((id) => (
                <SelectItem key={id} value={id}>
                  {CONTENT_STATUS_LABELS[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {grouped.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted">還沒有排程。從活動生成波段，或在 AI 創作裡按排入日曆。</p>
        ) : (
          <div className="space-y-4" data-testid="content-calendar">
            {grouped.map(([day, list]) => (
              <div key={day} className="rounded-2xl border border-border bg-surface p-3">
                <p className="mb-2 text-xs font-semibold text-accent">{day}</p>
                <ul className="space-y-2">
                  {list.map((post) => (
                    <li
                      key={post.id}
                      className="flex flex-col gap-2 rounded-xl bg-surface-2/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{CONTENT_TYPE_LABELS[post.contentType]}</Badge>
                          <span className="text-sm font-medium">{post.title}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-muted">{post.hook}</p>
                        <p className="text-[11px] text-subtle">{post.scheduledAt} · {post.sourceRef}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={post.status}
                          onValueChange={(v) => {
                            setPostStatus(post.id, v as ContentStatus);
                            toast.success("排程狀態已更新");
                          }}
                        >
                          <SelectTrigger className="h-9 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(CONTENT_STATUS_LABELS) as ContentStatus[]).map((id) => (
                              <SelectItem key={id} value={id}>
                                {CONTENT_STATUS_LABELS[id]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={() => deleteScheduledPost(post.id)}>
                          移除
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <CampaignEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaignId={editId}
        onSaved={(campaign, generate) => {
          selectCampaign(campaign.id);
          if (generate) onOpenAi?.(`${campaign.name} 完整宣傳波段`, campaign);
        }}
      />
    </main>
  );
}

function keyOf(item: CellItem): string {
  if (item.type === "content") return `c_${item.project.id}`;
  if (item.type === "pack") return `p_${item.rootId}_${item.at}`;
  if (item.type === "wave") return `w_${item.waveId}`;
  return `e_${item.campaign.id}`;
}

function isCellSelected(item: CellItem, pick: MoveTarget | null): boolean {
  if (!pick) return false;
  if (item.type === "pack" && pick.kind === "pack") {
    return pick.ids.some((id) => item.members.some((member) => member.id === id));
  }
  if (item.type === "content" && pick.kind === "content") return pick.id === item.project.id;
  if (item.type === "wave" && pick.kind === "wave") return pick.waveId === item.waveId;
  return false;
}

function CalendarChip({
  item,
  selected,
  tapMove,
  onBeginDrag,
  onEndDrag,
  onPick,
}: {
  item: CellItem;
  selected?: boolean;
  tapMove?: boolean;
  onBeginDrag: (target: MoveTarget, transfer: DataTransfer | null) => void;
  onEndDrag: () => void;
  onPick: (target: MoveTarget) => void;
}) {
  if (item.type === "event") {
    return (
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId: item.campaign.id }}
        className="block truncate rounded-lg bg-[color-mix(in_oklab,var(--color-warm)_28%,transparent)] px-1.5 py-1 text-xs font-medium"
      >
        {item.campaign.name || "活動"}
      </Link>
    );
  }
  if (item.type === "wave") {
    const target: MoveTarget = { kind: "wave", campaignId: item.campaign.id, waveId: item.waveId };
    return (
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId: item.campaign.id }}
        data-testid="calendar-chip-wave"
        draggable={!tapMove}
        onDragStart={(e) => onBeginDrag(target, e.dataTransfer)}
        onDragEnd={onEndDrag}
        onClick={(e) => {
          e.stopPropagation();
          if (!tapMove && !e.metaKey && !e.ctrlKey) return;
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          onPick(target);
        }}
        className={cn(
          "block truncate rounded-lg px-1.5 py-1 text-xs text-muted",
          selected && "bg-accent text-accent-fg",
        )}
        title={tapMove ? "點選後再點日期改期" : `${item.stage}·${item.title}（還沒建立，可拖去改期）`}
      >
        {item.title || item.stage}
      </Link>
    );
  }
  if (item.type === "pack") {
    const primary = item.members.find((member) => member.id === item.rootId) ?? item.members[0]!;
    const target: MoveTarget = { kind: "pack", ids: item.members.map((member) => member.id) };
    const label = packChipLabel(item.members);
    return (
      <Link
        to="/studio/$projectId"
        params={{ projectId: primary.id }}
        data-testid="calendar-chip-pack"
        draggable={!tapMove}
        onDragStart={(e) => onBeginDrag(target, e.dataTransfer)}
        onDragEnd={onEndDrag}
        onClick={(e) => {
          e.stopPropagation();
          if (!tapMove && !e.metaKey && !e.ctrlKey) return;
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          onPick(target);
        }}
        className={cn(
          "block truncate rounded-lg px-1.5 py-1 text-xs font-medium",
          selected
            ? "bg-accent text-accent-fg"
            : "bg-[color-mix(in_oklab,var(--color-clear)_22%,transparent)]",
        )}
        title={tapMove ? "點選後再點日期，全套一起改期" : `${primary.name} · ${label}`}
      >
        {label}
      </Link>
    );
  }
  const target: MoveTarget = { kind: "content", id: item.project.id };
  return (
    <Link
      to="/studio/$projectId"
      params={{ projectId: item.project.id }}
      data-testid="calendar-chip-content"
      draggable={!tapMove}
      onDragStart={(e) => onBeginDrag(target, e.dataTransfer)}
      onDragEnd={onEndDrag}
      onClick={(e) => {
        e.stopPropagation();
        if (!tapMove && !e.metaKey && !e.ctrlKey) return;
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        onPick(target);
      }}
      className={cn(
        "block truncate rounded-lg px-1.5 py-1 text-xs font-medium",
        selected
          ? "bg-accent text-accent-fg"
          : "bg-[color-mix(in_oklab,var(--color-clear)_22%,transparent)]",
      )}
      title={tapMove ? "點選後再點日期改期" : item.project.name}
    >
      {contentKindLabel(item.project.contentKind)}
    </Link>
  );
}

function AgendaPackCard({
  item,
  onReschedulePack,
}: {
  item: PackDayItem;
  onReschedulePack: (ids: string[], day: Date) => void;
}) {
  const primary = item.members.find((member) => member.id === item.rootId) ?? item.members[0]!;
  const ids = item.members.map((member) => member.id);
  const kinds = [...new Set(item.members.map((member) => member.contentKind))].sort(
    (a, b) => kindOrder(a) - kindOrder(b),
  );
  return (
    <>
      <div className="flex items-center gap-3">
        <label className="w-16 shrink-0 text-xs tabular-nums text-muted">
          <span className="block">{format(item.at, "M/d")}</span>
          <span className="block text-subtle">{format(item.at, "HH:mm")}</span>
          <input
            type="date"
            aria-label={`改期 ${packChipLabel(item.members)}`}
            value={format(item.at, "yyyy-MM-dd")}
            onChange={(e) => {
              if (!e.target.value) return;
              onReschedulePack(ids, new Date(`${e.target.value}T00:00:00`));
            }}
            className="mt-1 w-full min-h-8 rounded-lg bg-surface-2 px-1 text-xs text-fg"
          />
        </label>
        <Link to="/studio/$projectId" params={{ projectId: primary.id }} className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{primary.name}</span>
          <span className="block truncate text-xs text-muted">{packChipLabel(item.members)}</span>
        </Link>
        <StatusBadge status={primary.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {kinds.map((kind) => {
          const member = item.members.find((entry) => entry.contentKind === kind) ?? primary;
          return (
            <Link
              key={member.id}
              to="/studio/$projectId"
              params={{ projectId: member.id }}
              className="inline-flex min-h-9 items-center rounded-full bg-surface-2 px-3 text-xs text-muted"
            >
              {contentKindLabel(kind)}
            </Link>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PackFlowBar projectId={primary.id} />
        <DownloadPackButton projectId={primary.id} size="sm" variant="secondary" />
      </div>
      <PostPackBar
        copy={primary.copy}
        kind={primary.contentKind}
        projectId={primary.id}
        variant="compact"
        className="mt-3 pt-2"
      />
    </>
  );
}

function AgendaList({
  items,
  onRescheduleContent,
  onReschedulePack,
  onRescheduleWave,
}: {
  items: CellItem[];
  onRescheduleContent: (projectId: string, day: Date) => void;
  onReschedulePack: (ids: string[], day: Date) => void;
  onRescheduleWave: (campaignId: string, waveId: string, day: Date) => void;
}) {
  if (!items.length) return null;
  return (
    <ul className="mt-6 space-y-2">
      {items.map((item) => (
        <li key={keyOf(item)} className="rounded-2xl surface-card p-3">
          {item.type === "pack" ? (
            <AgendaPackCard item={item} onReschedulePack={onReschedulePack} />
          ) : item.type === "content" ? (
            <>
            <div className="flex items-center gap-3">
              <label className="w-16 shrink-0 text-xs tabular-nums text-muted">
                <span className="block">{format(item.at, "M/d")}</span>
                <span className="block text-subtle">{format(item.at, "HH:mm")}</span>
                <input
                  type="date"
                  aria-label={`改期 ${item.project.name}`}
                  value={format(item.at, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    onRescheduleContent(item.project.id, new Date(`${e.target.value}T00:00:00`));
                  }}
                  className="mt-1 w-full min-h-8 rounded-lg bg-surface-2 px-1 text-xs text-fg"
                />
              </label>
              <Link
                to="/studio/$projectId"
                params={{ projectId: item.project.id }}
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm font-medium">{item.project.name}</span>
                <span className="block truncate text-xs text-muted">
                  {contentKindLabel(item.project.contentKind)}
                </span>
              </Link>
              <StatusBadge status={item.project.status} />
            </div>
            {item.project.status === "scheduled" || item.project.status === "done" ? (
              <PostPackBar
                copy={item.project.copy}
                kind={item.project.contentKind}
                projectId={item.project.id}
                variant="compact"
                className="mt-3"
              />
            ) : null}
            </>
          ) : item.type === "event" ? (
            <Link
              to="/campaigns/$campaignId"
              params={{ campaignId: item.campaign.id }}
              className="flex items-center gap-3"
            >
              <span className="w-14 shrink-0 text-xs tabular-nums text-muted">{format(item.at, "M/d")}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.campaign.name}</span>
                <span className="block truncate text-xs text-muted">活動當天</span>
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <label className="w-16 shrink-0 text-xs tabular-nums text-subtle">
                <span className="block">{format(item.at, "M/d")}</span>
                <span className="block">節奏</span>
                <input
                  type="date"
                  aria-label={`改期 ${item.title || item.stage}`}
                  value={format(item.at, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    onRescheduleWave(item.campaign.id, item.waveId, new Date(`${e.target.value}T00:00:00`));
                  }}
                  className="mt-1 w-full min-h-8 rounded-lg bg-surface-2 px-1 text-xs text-fg"
                />
              </label>
              <Link
                to="/campaigns/$campaignId"
                params={{ campaignId: item.campaign.id }}
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm">{item.title}</span>
                <span className="block truncate text-xs text-subtle">{item.stage}·還沒建立</span>
              </Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
