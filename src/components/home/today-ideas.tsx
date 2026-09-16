import { Link } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIgDnaText, useIgInsightsText } from "@/hooks/use-ig-dna";
import { generateIdeas } from "@/lib/ai/campaign-ai";
import { formatBrandMemory } from "@/lib/studio/brand";
import { localTodayIdeas, type TodayIdea } from "@/lib/studio/ideas";
import { contentKindLabel } from "@/lib/studio/status";
import { DEFAULT_AUDIENCE_IDS } from "@/lib/zen/audience";
import { semesterPhaseAt } from "@/lib/zen/semester";
import { useStudio } from "@/stores/studio-store";

export function TodayIdeas() {
  const phase = semesterPhaseAt();
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const brand = useStudio((s) => s.brands[0]);
  const assets = useStudio((s) => s.assets);
  const igDnaText = useIgDnaText();
  const insightsText = useIgInsightsText();
  const [ideas, setIdeas] = useState<TodayIdea[]>(() => localTodayIdeas());
  const [adapter, setAdapter] = useState<"live" | "local">("local");

  useEffect(() => {
    let alive = true;
    const upcoming = campaigns
      .map((c) => c.name)
      .filter(Boolean)
      .slice(0, 4)
      .join("、");
    const recentTopics = projects
      .map((p) => p.name)
      .filter(Boolean)
      .slice(0, 8);
    void generateIdeas({
      data: {
        audienceIds: DEFAULT_AUDIENCE_IDS,
        recentTopics,
        upcoming,
        brandMemoryText: brand ? formatBrandMemory(brand.memory, assets) : undefined,
        igDnaText: igDnaText || undefined,
        insightsText: insightsText || undefined,
      },
    }).then((res) => {
      if (!alive) return;
      if (res.ideas.length) {
        setIdeas(res.ideas);
        setAdapter(res.adapter);
      }
    });
    return () => {
      alive = false;
    };
  }, [assets, brand, campaigns, igDnaText, insightsText, projects]);

  return (
    <section className="mt-10">
      <SectionHeader
        title="今日靈感"
        hint={`${phase.label}適合的角度`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={adapter === "live" ? "accent" : "default"}>
              {adapter === "live" ? "依現在學期生成" : "本機題目"}
            </Badge>
            <Button asChild variant="ghost" size="sm">
              <Link to="/create" search={{ from: "idea" }}>
                更多靈感
              </Link>
            </Button>
          </div>
        }
      />
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ideas.map((idea) => (
          <li key={idea.id}>
            <Link
              to="/create"
              search={{ from: "idea", seed: idea.hook, kind: idea.kind }}
              className="flex h-full flex-col gap-2 rounded-2xl surface-card p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <span className="flex items-center gap-2 text-xs text-muted">
                <Lightbulb className="size-3.5" />
                {contentKindLabel(idea.kind)}
              </span>
              <span className="font-display text-lg leading-snug">「{idea.hook}」</span>
              <span className="text-xs text-subtle">{idea.why || idea.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
