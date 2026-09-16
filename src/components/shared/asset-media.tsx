import { cn } from "@/lib/utils";

export function AssetMedia({
  src,
  video,
  alt = "",
  className,
  testId,
  controls,
  onError,
}: {
  src?: string | null;
  video?: boolean;
  alt?: string;
  className?: string;
  testId?: string;
  controls?: boolean;
  onError?: () => void;
}) {
  if (!src) return null;
  if (video) {
    return (
      <video
        src={src}
        className={cn("bg-bg object-cover", className)}
        data-testid={testId}
        muted
        playsInline
        preload="metadata"
        controls={controls}
        onError={onError}
      />
    );
  }
  return <img src={src} alt={alt} className={className} data-testid={testId} onError={onError} />;
}
