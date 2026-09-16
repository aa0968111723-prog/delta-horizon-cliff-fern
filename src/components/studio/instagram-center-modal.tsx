import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InstagramCenter } from "@/components/instagram/instagram-center";
import type { IgPostHistoryItem } from "@/lib/studio/instagram-insights";

export function InstagramCenterModal({
  open,
  onOpenChange,
  onUseAsTemplate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseAsTemplate?: (post: IgPostHistoryItem) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-y-auto rounded-2xl bg-surface p-4 text-fg sm:p-6">
        <DialogHeader className="border-b border-border pb-2">
          <DialogTitle>Instagram Center</DialogTitle>
          <DialogDescription className="text-xs text-muted">九宮格、歷史貼文與禪學社 IG DNA（示範記憶）</DialogDescription>
        </DialogHeader>
        <InstagramCenter
          onUseAsTemplate={(post) => {
            onUseAsTemplate?.(post);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
