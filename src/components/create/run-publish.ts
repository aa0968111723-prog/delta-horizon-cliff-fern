import { toast } from "sonner";
import { publishToInstagram } from "@/lib/connect/oauth";
import { publicImageUrl } from "@/lib/connect/ig-publish";
import { duePublishTargets, dueTodayTargets, type DueTarget } from "@/lib/creative/due-publish";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export async function runPublish(target: DueTarget) {
  const httpsUrl = publicImageUrl(target.imageUrl);
  let graph: { ok: true; mediaId: string; account: string } | { ok: false; message: string; reason?: string } = {
    ok: false,
    message: "IG 暫時發不出去，先標記進記憶。",
  };
  try {
    graph = await publishToInstagram({
      data: { caption: target.caption || target.title || "淡江禪學社", imageUrl: httpsUrl ?? undefined },
    });
  } catch {
    graph = { ok: false, message: "IG 暫時發不出去，先標記進記憶。" };
  }

  const post = useCreative.getState().markPublished({
    campaignId: target.campaignId,
    waveId: target.waveId,
    projectId: target.projectId,
    title: target.title,
    caption: target.caption,
    kind: target.kind,
  });
  if (graph.ok && post) {
    useCreative.getState().ingestIgPosts([
      {
        ...post,
        id: `ig_${graph.mediaId}`,
        source: "instagram",
      },
    ]);
  }
  if (target.projectId) {
    const studio = useStudio.getState();
    if (studio.projects.some((item) => item.id === target.projectId)) {
      studio.updateProject(target.projectId, {
        status: "published",
        publishedAt: post?.takenAt ?? Date.now(),
      });
    }
  }
  return { graph, post };
}

let inflight = false;

export async function flushDueOnce(opts?: { includeToday?: boolean; silent?: boolean }) {
  if (inflight) return [];
  const campaigns = useCreative.getState().campaigns;
  const projects = useStudio.getState().projects;
  const targets = opts?.includeToday
    ? dueTodayTargets({ campaigns, projects })
    : duePublishTargets({ campaigns, projects });
  if (!targets.length) return [];
  inflight = true;
  try {
    const results = [];
    for (const target of targets) {
      results.push(await runPublish(target));
    }
    if (!opts?.silent) {
      const live = results.filter((item) => item.graph.ok).length;
      toast.message(
        live
          ? `到期內容已發 ${live} 則到 IG，其餘進 Content Memory。下次生成會參考。`
          : `到期 ${results.length} 則已進 Content Memory。連上 IG 且有公開圖就會真正發出去。`,
      );
    }
    return results;
  } finally {
    inflight = false;
  }
}
