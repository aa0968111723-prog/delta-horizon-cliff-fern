import { toast } from "sonner";
import { applyFormatSuite, type ApplySuiteResult } from "@/components/create/apply-suite";
import type { CreativePack } from "@/lib/zen/types";

export async function applyPickedDirection(input: {
  pack: CreativePack;
  directionId?: string;
  campaignId?: string | null;
}): Promise<ApplySuiteResult> {
  toast.message("正在做成 Post、5 頁 Carousel、Story、Reels 分鏡、Threads、LINE…");
  try {
    const result = await applyFormatSuite(input);
    if (!result.ok) {
      toast.error(result.error);
      return result;
    }
    toast.success(`已做成 ${result.count} 種格式（${result.pages} 張分鏡），打開 IG Preview`);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : "做成整套時出了問題";
    toast.error(error);
    return { ok: false, error };
  }
}
