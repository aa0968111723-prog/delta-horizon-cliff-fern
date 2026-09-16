import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CAMPAIGN_TYPES, useCreative } from "@/stores/creative-store";
import type { CampaignType } from "@/lib/creative/types";
import { daysUntil } from "@/lib/club/season";

export function CampaignList() {
  const campaigns = useCreative((s) => s.campaigns);
  const addCampaign = useCreative((s) => s.addCampaign);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("2026-09-24");
  const [type, setType] = useState<CampaignType>("tea");
  const [oneLiner, setOneLiner] = useState("");
  const [location, setLocation] = useState("淡江校園");

  function create() {
    if (!name.trim()) return;
    const campaign = addCampaign({ name: name.trim(), date, type, oneLiner, location, time: "19:30" });
    toast.success("活動已建立，可生成完整宣傳");
    void navigate({ to: "/campaigns/$campaignId", params: { campaignId: campaign.id } });
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">活動</p>
          <h1 className="mt-1 font-display text-3xl">Campaign</h1>
        </div>
        <Button onClick={() => setOpen(true)}>建立活動</Button>
      </div>
      <ul className="mt-8 space-y-3">
        {campaigns.map((c) => (
          <li key={c.id}>
            <Link
              to="/campaigns/$campaignId"
              params={{ campaignId: c.id }}
              className="block rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <p className="font-display text-xl">{c.name}</p>
              <p className="mt-1 text-sm text-muted">
                {c.date} {c.time} · {c.location} · 還有 {daysUntil(c.date)} 天
              </p>
              <p className="mt-2 text-sm">{c.oneLiner}</p>
            </Link>
          </li>
        ))}
      </ul>
      {open ? (
        <div className="mt-8 space-y-3 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <Label>活動名稱</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：浮游禪光" />
          <Label>日期</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Label>地點</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          <Label>一句介紹</Label>
          <Textarea value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} placeholder="一個不用表演的晚上" />
          <div className="flex flex-wrap gap-1">
            {CAMPAIGN_TYPES.map((t) => (
              <Button key={t.id} size="sm" variant={type === t.id ? "default" : "secondary"} onClick={() => setType(t.id)}>
                {t.label}
              </Button>
            ))}
          </div>
          <Button onClick={create}>建立並生成節奏</Button>
        </div>
      ) : null}
    </main>
  );
}
