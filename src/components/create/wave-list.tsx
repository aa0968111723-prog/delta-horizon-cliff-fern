import { regenerateCampaignWave, type WaveDraft } from "@/lib/ai/wave";
import { waveLabel } from "@/lib/zen/schedule";
import type { CampaignWave, CampaignWaveKind } from "@/lib/studio/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function WaveList({
  waves,
  name,
  schedule,
  location,
  idea,
}: {
  waves: CampaignWave[];
  name: string;
  schedule: string;
  location: string;
  idea: string;
}) {
  const [drafts, setDrafts] = useState<Partial<Record<CampaignWaveKind, WaveDraft>>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function regen(kind: CampaignWaveKind, twist?: "rewrite" | "visual" | "angle") {
    setBusy(`${kind}:${twist || "rewrite"}`);
    try {
      const result = await regenerateCampaignWave({
        data: { kind, name, schedule, location, idea, twist },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDrafts((prev) => ({ ...prev, [kind]: result.draft }));
      toast.success(`${waveLabel(kind)}已重寫`);
    } catch {
      toast.error("這波暫時無法重寫，可再試一次。");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium">宣傳節奏</h2>
      <p className="mt-1 text-xs text-muted">每一波可單獨重寫、換視覺、換角度。沒有審核人。</p>
      <ul className="mt-3 space-y-2">
        {waves.map((wave) => {
          const draft = drafts[wave.kind];
          return (
            <li key={wave.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">{wave.title}</p>
              <p className="mt-1 text-xs text-muted">{wave.notes}</p>
              {draft ? (
                <div className="mt-2 text-sm">
                  <p className="font-display text-lg">{draft.hook}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted">{draft.body}</p>
                  <p className="mt-1 text-xs text-subtle">{draft.visualNote}</p>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void regen(wave.kind, "rewrite")}>
                  重新生成
                </Button>
                <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void regen(wave.kind, "visual")}>
                  換視覺
                </Button>
                <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void regen(wave.kind, "angle")}>
                  換角度
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
