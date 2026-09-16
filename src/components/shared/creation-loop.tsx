import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { campaignToBrief } from "@/lib/creative/brief-from-campaign";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useUi } from "@/stores/ui-store";

export type CreationStep = "campaign" | "copy" | "image" | "preview" | "schedule" | "export";

type LoopHref = "/campaigns" | "/assistant" | "/assets" | "/instagram" | "/calendar" | "/export";

const STEPS: { id: CreationStep; label: string; to: LoopHref; hash?: string }[] = [
  { id: "campaign", label: "活動", to: "/campaigns" },
  { id: "copy", label: "文案", to: "/assistant" },
  { id: "image", label: "畫面", to: "/assets" },
  { id: "preview", label: "預覽", to: "/instagram", hash: "preview" },
  { id: "schedule", label: "排程", to: "/calendar" },
  { id: "export", label: "匯出", to: "/export" },
];

const NEXT: Record<CreationStep, { label: string; to: LoopHref; hash?: string }> = {
  campaign: { label: "下一步：生成文案", to: "/assistant" },
  copy: { label: "下一步：生成畫面", to: "/assets" },
  image: { label: "下一步：看 IG 預覽", to: "/instagram", hash: "preview" },
  preview: { label: "下一步：排進節奏", to: "/calendar" },
  schedule: { label: "下一步：匯出內容包", to: "/export" },
  export: { label: "回活動看下一波", to: "/campaigns" },
};

export function CreationLoop({
  current,
  compact = false,
}: {
  current?: CreationStep;
  compact?: boolean;
}) {
  const next = current ? NEXT[current] : { label: "從下一場活動開始", to: "/campaigns" as const };
  const campaigns = useCreative((state) => state.campaigns);
  const activeCampaignId = useCreative((state) => state.activeCampaignId);
  const primeCreative = useUi((state) => state.primeCreative);
  const campaign = campaigns.find((item) => item.id === activeCampaignId) ?? campaigns[0];

  function handoffToCopy() {
    if (!campaign) return;
    primeCreative(campaignToBrief(campaign));
  }

  return (
    <nav aria-label="一人網宣流程" className={cn("min-w-0", compact ? "" : "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]")}>
      {compact ? null : (
        <p className="text-xs text-muted">一人完成淡江禪學社網宣 · 不會自動發文</p>
      )}
      <ol className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
        {STEPS.map((step, index) => {
          const active = step.id === current;
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-2">
              <Link
                to={step.to}
                hash={step.hash}
                onClick={() => {
                  if (step.id === "copy") handoffToCopy();
                }}
                className={cn(
                  "flex min-h-11 items-center rounded-full px-3 text-sm",
                  active ? "bg-accent text-accent-fg" : "bg-bg text-muted shadow-[var(--shadow-border)]",
                )}
              >
                <span className="mr-1.5 tabular-nums text-xs opacity-70">{index + 1}</span>
                {step.label}
              </Link>
              {index < STEPS.length - 1 ? <ChevronRight className="size-3.5 shrink-0 text-subtle" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
      <Link
        to={next.to}
        hash={current ? NEXT[current].hash : undefined}
        onClick={() => {
          if (current === "campaign" || (!current && next.to === "/assistant")) handoffToCopy();
        }}
        className="mt-3 inline-flex min-h-11 items-center text-sm text-accent"
      >
        {next.label}
        <ChevronRight className="ml-1 size-4" />
      </Link>
      {compact ? null : (
        <p className="mt-2 text-xs leading-5 text-muted">
          貼出去或活動結束後，用現場筆記記下誰來了、哪句像淡江。
          {" "}
          <Link to="/instagram" hash="learn" className="text-accent">打開現場筆記</Link>
        </p>
      )}
    </nav>
  );
}
