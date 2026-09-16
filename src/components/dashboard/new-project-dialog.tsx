import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DELIVERABLE_OPTIONS, emptyBrief } from "@/lib/studio/brief";
import { FORMATS } from "@/lib/studio/formats";
import { GOALS } from "@/lib/studio/goals";
import type { Brief, CampaignGoal, FormatId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewProjectDialog({ open, onOpenChange }: Props) {
  const brands = useStudio((s) => s.brands);
  const createProject = useStudio((s) => s.createProject);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [formatId, setFormatId] = useState<FormatId>("feed-portrait");
  const [brief, setBrief] = useState<Brief>(emptyBrief());
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("請輸入專案名稱。");
      return;
    }
    if (!brief.eventName.trim() || !brief.audience.trim()) {
      setError("請填寫活動名稱與受眾，之後創作才有依據。");
      return;
    }
    if (!brandId) {
      setError("請先建立品牌。");
      return;
    }
    const project = createProject({
      name: name.trim(),
      brandId,
      formatId,
      brief: { ...brief, product: brief.product || brief.eventName },
    });
    onOpenChange(false);
    setName("");
    setBrief(emptyBrief());
    setError(null);
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建網宣專案</DialogTitle>
          <DialogDescription>先寫清楚活動與受眾，再開 Studio 編輯畫面與文案。</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">專案名稱</Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：09/24 浮游禪光"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>品牌</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇品牌" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>主尺寸</Label>
              <Select value={formatId} onValueChange={(v) => setFormatId(v as FormatId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} · {f.short}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event">活動名稱</Label>
            <Input
              id="event"
              value={brief.eventName}
              onChange={(e) =>
                setBrief({ ...brief, eventName: e.target.value, product: brief.product || e.target.value })
              }
              placeholder="浮游禪光、週三社課"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="schedule">時間</Label>
              <Input
                id="schedule"
                value={brief.schedule}
                onChange={(e) => setBrief({ ...brief, schedule: e.target.value })}
                placeholder="9/12–9/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">地點</Label>
              <Input
                id="location"
                value={brief.location}
                onChange={(e) => setBrief({ ...brief, location: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audience">受眾</Label>
            <Input
              id="audience"
              value={brief.audience}
              onChange={(e) => setBrief({ ...brief, audience: e.target.value })}
              placeholder="誰會停下來看這則"
            />
          </div>
          <div className="space-y-1.5">
            <Label>目標</Label>
            <Select
              value={brief.goal}
              onValueChange={(v) => setBrief({ ...brief, goal: v as CampaignGoal })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>需要產出</Label>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERABLE_OPTIONS.map((opt) => {
                const on = brief.deliverables[opt.id];
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setBrief({
                        ...brief,
                        deliverables: { ...brief.deliverables, [opt.id]: !brief.deliverables[opt.id] },
                      })
                    }
                    className={cn(
                      "min-h-11 rounded-lg px-3 text-left text-sm shadow-[var(--shadow-border)]",
                      on ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-2",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">打開 Studio</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
