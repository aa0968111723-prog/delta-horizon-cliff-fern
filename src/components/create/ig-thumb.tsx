import { cn } from "@/lib/utils";

export function IgThumb({
  src,
  caption,
  className,
}: {
  src: string;
  caption?: string;
  className?: string;
}) {
  const line = caption?.split("\n")[0]?.trim() ?? "";
  return (
    <div className={cn("relative aspect-square overflow-hidden bg-[#1c2422]", className)}>
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/15" />
      {line ? (
        <p className="absolute inset-x-2 bottom-2 line-clamp-2 text-left text-[11px] leading-snug text-white">
          {line}
        </p>
      ) : null}
    </div>
  );
}
