import { Palette, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { emptyBrandMemory } from "@/lib/studio/brand";
import { useConnectionStore } from "@/stores/connection-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function StyleMemoryPanel() {
  const references = useConnectionStore((state) => state.styleReferences);
  const removeStyleReference = useConnectionStore((state) => state.removeStyleReference);
  const brand = useStudio((state) => state.brands[0]);
  const updateBrand = useStudio((state) => state.updateBrand);
  const setStylePrompt = useUi((state) => state.setStylePrompt);

  function absorb(id: string) {
    if (!brand) return;
    const reference = references.find((item) => item.id === id);
    if (!reference) return;
    const memory = brand.memory ?? emptyBrandMemory();
    const lesson = `${reference.collection}：延續「${reference.title}」的畫面語言。${reference.notes}`.slice(0, 160);
    updateBrand(brand.id, {
      memory: {
        ...memory,
        learnedPatterns: [lesson, ...memory.learnedPatterns.filter((item) => item !== lesson)].slice(0, 12),
        updatedAt: Date.now(),
      },
    });
    toast.success("已寫入 Brand Memory 的已學到規律");
  }

  return (
    <div className="rounded-2xl bg-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
            <p className="flex items-center gap-2 text-sm font-medium">
            <Palette className="size-4 text-accent" />
            Canva 風格參考
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            從連接頁分析過的真實 Canva 設計。寫入規律後，下次文案與畫面生成會帶進 Creative Memory。沒有連接時這裡會是空的，不會放模擬稿。
          </p>
        </div>
        <Badge variant="default">{references.length}</Badge>
      </div>
      {references.length ? (
        <ul className="mt-3 space-y-2">
          {references.map((item) => (
            <li key={item.id} className="rounded-xl bg-surface p-3">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted">{item.provider}／{item.collection}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{item.notes}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setStylePrompt({
                    title: item.title,
                    collection: item.collection,
                    notes: item.notes,
                    provider: item.provider,
                  })}
                >
                  <Sparkles className="size-3.5" />
                  當成生成參考
                </Button>
                <Button size="sm" variant="secondary" onClick={() => absorb(item.id)}>
                  寫入規律
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeStyleReference(item.id)}>
                  <Trash2 className="size-3.5" />
                  移除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">還沒有風格參考。到連接頁同步真實 Canva 設計後再分析。</p>
      )}
    </div>
  );
}
