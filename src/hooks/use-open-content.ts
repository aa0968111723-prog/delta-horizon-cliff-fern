import { useNavigate } from "@tanstack/react-router";
import { campaignToBrief } from "@/lib/creative/brief-from-campaign";
import { contentOpenPlan } from "@/lib/creative/open-content";
import type { ContentItem } from "@/lib/creative/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function useOpenContentWork() {
  const navigate = useNavigate();
  const campaigns = useCreative((state) => state.campaigns);
  const projects = useStudio((state) => state.projects);
  const setLastProjectId = useStudio((state) => state.setLastProjectId);
  const setActiveFormat = useStudio((state) => state.setActiveFormat);
  const setContentStatus = useCreative((state) => state.setContentStatus);
  const primeCreative = useUi((state) => state.primeCreative);
  const setCreationDesk = useUi((state) => state.setCreationDesk);
  const setAssistantOpen = useUi((state) => state.setAssistantOpen);

  function openWork(item: ContentItem, prefer?: "studio" | "copy" | "preview") {
    const plan = contentOpenPlan(item);
    const project = plan.projectId
      ? projects.find((row) => row.id === plan.projectId)
      : undefined;
    const campaign = campaigns.find((row) => row.id === item.campaignId);

    if (prefer === "preview" && project) {
      setLastProjectId(project.id);
      void navigate({
        to: "/instagram",
        hash: "preview",
        search: { project: project.id, content: item.id, surface: plan.surface },
      });
      return;
    }

    if (!plan.hasWork || !project) {
      if (campaign) {
        setContentStatus(item.id, "creating");
        primeCreative(campaignToBrief(campaign, item), item.id);
        setCreationDesk("plan");
        setAssistantOpen(false);
      }
      void navigate({ to: "/assistant" });
      return;
    }

    const kind = prefer === "copy" ? "copy" : prefer === "studio" ? "studio" : plan.kind;
    setLastProjectId(project.id);
    setAssistantOpen(false);
    if (kind === "copy") {
      setCreationDesk("copy");
      void navigate({
        to: "/assistant",
        search: { project: project.id, desk: "copy" },
      });
      return;
    }
    setActiveFormat(project.id, plan.formatId);
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  return { openWork };
}
