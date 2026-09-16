import { Link } from "@tanstack/react-router";
import { AssistantForm } from "@/components/assistant/assistant-form";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function AssistantSheet() {
  const open = useUi((s) => s.assistantOpen);
  const setOpen = useUi((s) => s.setAssistantOpen);
  const lastProjectId = useStudio((s) => s.lastProjectId);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="flex max-h-[86dvh] flex-col p-0 lg:max-h-[92dvh]">
        <div className="border-b border-border px-4 py-3 pr-12">
          <SheetTitle>畫布代理</SheetTitle>
          <p className="mt-1 text-sm text-muted">
            對目前畫面下指令，或寫活動需求生成企劃。{" "}
            <Link
              to="/assistant"
              className="text-fg underline-offset-2 hover:underline"
              onClick={() => setOpen(false)}
            >
              開啟完整頁面
            </Link>
          </p>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-4 py-4">
          <AssistantForm variant="sheet" projectId={lastProjectId} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
