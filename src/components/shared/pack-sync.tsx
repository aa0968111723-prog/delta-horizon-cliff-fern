import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { convertPackOf } from "@/lib/studio/convert-pack";
import { useStudio } from "@/stores/studio-store";

/** 做成全套之後：這則改的文案或主視覺一次寫進其他型態。 */
export function PackSyncButtons({ projectId }: { projectId: string }) {
  const projects = useStudio((s) => s.projects);
  const pack = convertPackOf(projects, projectId);
  if (pack.length < 2) return null;
  return (
    <>
      <SpreadCopyButton projectId={projectId} />
      <SpreadVisualButton projectId={projectId} />
    </>
  );
}

function SpreadCopyButton({ projectId }: { projectId: string }) {
  const applyCopyToPack = useStudio((s) => s.applyCopyToPack);
  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label="文案套到全套"
      onClick={() => {
        const count = applyCopyToPack(projectId);
        if (count > 1) toast.success(`這則文案已套到 ${count} 種型態。輪播、限動各頁也換了。`);
        else toast.info("這則還沒做成其他型態。");
      }}
    >
      文案套到全套
    </Button>
  );
}

function SpreadVisualButton({ projectId }: { projectId: string }) {
  const applyVisualToPack = useStudio((s) => s.applyVisualToPack);
  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label="畫面套到全套"
      onClick={() => {
        const count = applyVisualToPack(projectId);
        if (count > 1) toast.success(`主視覺已套到 ${count} 種畫面。限動、LINE、Reels 封面也換了。`);
        else if (count === 1) toast.info("這則還沒做成其他有畫面的型態。");
        else toast.info("這則還沒有主視覺。");
      }}
    >
      畫面套到全套
    </Button>
  );
}
