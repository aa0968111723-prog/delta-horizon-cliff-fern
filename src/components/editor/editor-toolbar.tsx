import {
  Circle,
  Frame,
  Minus,
  MousePointer2,
  Scan,
  Square,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EditorTool } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

const TOOLS: { id: EditorTool; label: string; icon: typeof Type }[] = [
  { id: "select", label: "選取", icon: MousePointer2 },
  { id: "text", label: "文字", icon: Type },
  { id: "rect", label: "矩形", icon: Square },
  { id: "ellipse", label: "圓形", icon: Circle },
  { id: "line", label: "線條", icon: Minus },
];

export function EditorToolbar() {
  const tool = useStudio((s) => s.editor.tool);
  const zoom = useStudio((s) => s.editor.zoom);
  const showGrid = useStudio((s) => s.editor.showGrid);
  const showSafe = useStudio((s) => s.editor.showSafe);
  const showBounds = useStudio((s) => s.editor.showBounds);
  const setEditor = useStudio((s) => s.setEditor);

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5">
      {TOOLS.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            size="sm"
            variant={tool === item.id ? "default" : "ghost"}
            onClick={() => setEditor({ tool: item.id })}
            aria-label={item.label}
            className={cn("shrink-0")}
          >
            <Icon className="size-4" />
            <span className="hidden md:inline">{item.label}</span>
          </Button>
        );
      })}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <Button size="sm" variant={zoom === 0 ? "secondary" : "ghost"} onClick={() => setEditor({ zoom: 0 })}>
        適應
      </Button>
      <Button size="sm" variant={zoom === 0.5 ? "secondary" : "ghost"} onClick={() => setEditor({ zoom: 0.5 })}>
        50%
      </Button>
      <Button size="sm" variant={zoom === 1 ? "secondary" : "ghost"} onClick={() => setEditor({ zoom: 1 })}>
        100%
      </Button>
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <Button
        size="icon-sm"
        variant={showSafe ? "secondary" : "ghost"}
        aria-label="安全區"
        onClick={() => setEditor({ showSafe: !showSafe })}
      >
        <Scan className="size-4" />
      </Button>
      <Button
        size="icon-sm"
        variant={showBounds ? "secondary" : "ghost"}
        aria-label="畫布邊界"
        onClick={() => setEditor({ showBounds: !showBounds })}
      >
        <Frame className="size-4" />
      </Button>
      <Button
        size="sm"
        variant={showGrid ? "secondary" : "ghost"}
        onClick={() => setEditor({ showGrid: !showGrid })}
      >
        格線
      </Button>
    </div>
  );
}
