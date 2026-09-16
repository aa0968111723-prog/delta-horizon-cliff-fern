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
import { FORMATS } from "@/lib/studio/formats";
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

export function EditorToolbar({ projectId }: { projectId?: string }) {
  const tool = useStudio((s) => s.editor.tool);
  const zoom = useStudio((s) => s.editor.zoom);
  const showGrid = useStudio((s) => s.editor.showGrid);
  const showSafe = useStudio((s) => s.editor.showSafe);
  const showBounds = useStudio((s) => s.editor.showBounds);
  const setEditor = useStudio((s) => s.setEditor);
  const project = useStudio((s) => (projectId ? s.projects.find((item) => item.id === projectId) : undefined));
  const setActiveFormat = useStudio((s) => s.setActiveFormat);

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
            className={cn("min-h-11 shrink-0")}
          >
            <Icon className="size-4" />
            <span className="hidden md:inline">{item.label}</span>
          </Button>
        );
      })}
      {project ? (
        <div className="flex shrink-0 gap-1 md:hidden">
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          {FORMATS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              className="min-h-11 shrink-0"
              variant={project.activeFormatId === f.id ? "default" : "ghost"}
              onClick={() => setActiveFormat(project.id, f.id)}
            >
              {f.short}
            </Button>
          ))}
        </div>
      ) : null}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <Button size="sm" className="min-h-11 shrink-0" variant={zoom === 0 ? "secondary" : "ghost"} onClick={() => setEditor({ zoom: 0 })}>
        適應
      </Button>
      <Button size="sm" className="min-h-11 shrink-0" variant={zoom === 0.5 ? "secondary" : "ghost"} onClick={() => setEditor({ zoom: 0.5 })}>
        50%
      </Button>
      <Button size="sm" className="min-h-11 shrink-0" variant={zoom === 1 ? "secondary" : "ghost"} onClick={() => setEditor({ zoom: 1 })}>
        100%
      </Button>
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <Button
        size="icon-sm"
        className="min-h-11 min-w-11"
        variant={showSafe ? "secondary" : "ghost"}
        aria-label="安全區"
        onClick={() => setEditor({ showSafe: !showSafe })}
      >
        <Scan className="size-4" />
      </Button>
      <Button
        size="icon-sm"
        className="min-h-11 min-w-11"
        variant={showBounds ? "secondary" : "ghost"}
        aria-label="畫布邊界"
        onClick={() => setEditor({ showBounds: !showBounds })}
      >
        <Frame className="size-4" />
      </Button>
      <Button
        size="sm"
        className="min-h-11 shrink-0"
        variant={showGrid ? "secondary" : "ghost"}
        onClick={() => setEditor({ showGrid: !showGrid })}
      >
        格線
      </Button>
    </div>
  );
}
