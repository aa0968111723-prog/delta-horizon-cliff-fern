import { Link } from "@tanstack/react-router";
import { SwatchBook } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import type { BrandKit, ColorRole } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

const STRIP_ROLES: { id: ColorRole; label: string }[] = [
  { id: "primary", label: "主色" },
  { id: "secondary", label: "輔助" },
  { id: "background", label: "背景" },
  { id: "accent", label: "強調" },
  { id: "ink", label: "文字" },
];

export function BrandOnCanvas({
  projectId,
  brand,
}: {
  projectId: string;
  brand: BrandKit;
}) {
  const updateBrand = useStudio((state) => state.updateBrand);
  const applyBrandKit = useStudio((state) => state.applyBrandKit);
  const urls = useAssetUrls(brand.logoAssetId ? [brand.logoAssetId] : []);

  function patchColor(role: ColorRole, hex: string) {
    updateBrand(brand.id, {
      colors: brand.colors.map((color) => (color.role === role ? { ...color, hex: hex.toUpperCase() } : color)),
    });
  }

  return (
    <div
      data-testid="brand-on-canvas"
      className="flex min-h-11 min-w-0 items-center gap-2 overflow-x-auto px-2 py-1"
    >
      <Link
        to="/brand"
        className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg"
        aria-label="打開 Brand Memory"
      >
        {brand.logoAssetId && urls[brand.logoAssetId] ? (
          <img src={urls[brand.logoAssetId]} alt="" className="size-full object-contain p-1" />
        ) : (
          <SwatchBook className="size-4 text-muted" />
        )}
      </Link>
      <div className="flex shrink-0 gap-1">
        {STRIP_ROLES.map((role) => {
          const color = brand.colors.find((item) => item.role === role.id);
          return (
            <label
              key={role.id}
              className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border"
              title={`${role.label} ${color?.hex ?? ""}`}
            >
              <span className="sr-only">{role.label}</span>
              <input
                type="color"
                data-testid={`brand-swatch-${role.id}`}
                value={color?.hex ?? "#174D49"}
                onChange={(event) => patchColor(role.id, event.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span className="block size-full" style={{ background: color?.hex ?? "#174D49" }} />
            </label>
          );
        })}
      </div>
      <p className="hidden min-w-0 shrink truncate text-xs text-muted sm:block">
        {brand.fontDisplay}／{brand.fontBody}
      </p>
      <Button
        size="sm"
        variant="secondary"
        data-testid="apply-brand"
        className={cn("ml-auto min-h-11 shrink-0")}
        onClick={() => {
          const ok = applyBrandKit(projectId);
          toast.success(ok ? "已把 Brand Memory 套到這則網宣" : "找不到這則網宣");
        }}
      >
        套用品牌
      </Button>
    </div>
  );
}
