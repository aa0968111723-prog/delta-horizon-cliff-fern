import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NewCampaignDialog } from "@/components/campaigns/new-campaign-dialog";
import { CreationLoop } from "@/components/shared/creation-loop";
import { OutcomeJournal } from "@/components/learning/outcome-journal";
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
import { campaignToBrief } from "@/lib/creative/brief-from-campaign";
import type {
  Campaign,
  ContentItem,
  ContentStatus,
} from "@/lib/creative/types";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

const STATUS: Record<
  ContentStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  idea: { label: "想法", tone: "default" },
  creating: { label: "創作中", tone: "warn" },
  complete: { label: "完成", tone: "accent" },
  scheduled: { label: "已排程", tone: "accent" },
  published: { label: "已發布", tone: "success" },
};

export function CampaignCenter() {
  const campaigns = useCreative((state) => state.campaigns);
  const contentItems = useCreative((state) => state.contentItems);
  const generateRhythm = useCreative((state) => state.generateRhythm);
  const setContentStatus = useCreative((state) => state.setContentStatus);
  const setProjectStatus = useStudio((state) => state.setProjectStatus);
  const startCreative = useUi((state) => state.startCreative);
  const setActiveCampaignId = useCreative((state) => state.setActiveCampaignId);
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);

  function onCreated(id: string) {
    setSelectedId(id);
    setActiveCampaignId(id);
  }

  const campaign = campaigns.find((item) => item.id === selectedId) ?? campaigns[0];
  const items = useMemo(
    () =>
      contentItems
        .filter((item) => item.campaignId === campaign?.id)
        .sort((a, b) => a.plannedAt.localeCompare(b.plannedAt)),
    [campaign?.id, contentItems],
  );

  function campaignBrief(target: Campaign, item?: ContentItem) {
    return campaignToBrief(target, item);
  }

  function createContent(item: ContentItem) {
    if (!campaign) return;
    setContentStatus(item.id, "creating");
    if (item.projectId) setProjectStatus(item.projectId, "creating");
    startCreative(campaignBrief(campaign, item), item.id);
  }

  if (!campaign) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <PageHeader
          kicker="CAMPAIGN"
          title="從下一場活動開始"
          description="建立活動後，先安排一版宣傳節奏，再逐篇進入 AI 創作。"
          actions={<Button onClick={() => setDialogOpen(true)}><Plus className="size-4" />建立活動</Button>}
        />
        <NewCampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={onCreated} />
        <div className="mt-8">
          <CreationLoop current="campaign" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="一人完成整套淡江禪學社網宣"
        title="Campaign"
        description="活動資訊、學生情境與每一波內容放在一起。一人完成淡江禪學社網宣。"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            建立活動
          </Button>
        }
      />

      <CreationLoop current="campaign" />

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {campaigns.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSelectedId(item.id);
              setActiveCampaignId(item.id);
            }}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-4 text-sm transition-colors",
              item.id === campaign.id
                ? "bg-accent text-accent-fg"
                : "bg-surface text-muted shadow-[var(--shadow-border)]",
            )}
          >
            {item.name}
          </button>
        ))}
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{campaign.type}</Badge>
              <span className="text-xs text-muted">淡江學生專屬 Campaign</span>
            </div>
            <h2 className="mt-4 font-display text-3xl tracking-tight">{campaign.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {campaign.oneLiner || campaign.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span className="flex items-center gap-2"><CalendarDays className="size-4 text-accent" />{format(parseISO(campaign.eventDate), "M月d日 EEEE", { locale: zhTW })}</span>
              {campaign.eventTime ? <span className="flex items-center gap-2"><Clock3 className="size-4 text-accent" />{campaign.eventTime}</span> : null}
              <span className="flex items-center gap-2"><MapPin className="size-4 text-accent" />{campaign.location}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => startCreative(campaignBrief(campaign))}>
                <Sparkles className="size-4" />
                AI 生成完整宣傳
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  generateRhythm(campaign.id);
                  toast.success("本機節奏草案已依活動日期更新");
                }}
              >
                <RefreshCw className="size-4" />
                重排內容節奏
              </Button>
            </div>
          </div>
          <div className="bg-accent p-5 text-accent-fg sm:p-7">
            <p className="text-xs tracking-widest text-accent-fg/65">STUDENT CONTEXT</p>
            <h3 className="mt-3 font-display text-xl">先理解學生，再講活動</h3>
            <p className="mt-3 text-sm leading-6 text-accent-fg/80">{campaign.studentPain}</p>
            {campaign.theme ? (
              <div className="mt-6 rounded-xl bg-accent-fg/10 p-4">
                <p className="text-xs text-accent-fg/65">宣傳主題</p>
                <p className="mt-1 font-display text-lg">{campaign.theme}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted">CONTENT RHYTHM</p>
            <h2 className="mt-1 font-display text-xl">宣傳節奏</h2>
            <p className="mt-1 text-sm text-muted">這是可調整的本機節奏草案，不會自動發布。</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/assistant">從一句想法開始 <ChevronRight className="size-4" /></Link>
          </Button>
        </div>

        <ol className="mt-4 space-y-3">
          {items.map((item, index) => {
            const meta = STATUS[item.status];
            return (
              <li key={item.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
                <div className="grid gap-4 sm:grid-cols-[6rem_1fr_auto] sm:items-center">
                  <div>
                    <p className="text-xs font-medium text-accent">
                      {format(parseISO(item.plannedAt), "M/d EEE", { locale: zhTW })}
                    </p>
                    <p className="mt-1 text-xs text-muted">{format(parseISO(item.plannedAt), "HH:mm")}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-subtle">#{String(index + 1).padStart(2, "0")}</span>
                      <Badge>{item.type}</Badge>
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                    </div>
                    <h3 className="mt-2 font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{item.angle}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Select
                      value={item.status}
                      onValueChange={(value) => {
                        const status = value as ContentStatus;
                        setContentStatus(item.id, status);
                        if (item.projectId) setProjectStatus(item.projectId, status);
                      }}
                    >
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS).map(([value, status]) => (
                          <SelectItem key={value} value={value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="min-h-11" onClick={() => createContent(item)}>
                      <Sparkles className="size-4" />
                      AI 創作
                    </Button>
                    {item.projectId ? (
                      <>
                        <Button size="sm" className="min-h-11" variant="secondary" asChild>
                          <Link to="/instagram" hash="preview">IG 預覽</Link>
                        </Button>
                        <Button size="sm" className="min-h-11" variant="ghost" asChild>
                          <Link to="/export">匯出</Link>
                        </Button>
                      </>
                    ) : null}
                    {(item.status === "complete" || item.status === "published" || item.status === "scheduled") ? (
                      <Button size="sm" className="min-h-11" variant="ghost" asChild>
                        <Link to="/instagram" hash="learn">現場筆記</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-8 min-w-0">
        <OutcomeJournal />
      </div>

      <NewCampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={onCreated} />
    </main>
  );
}
