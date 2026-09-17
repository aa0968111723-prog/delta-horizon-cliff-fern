export function AssetMedia({
  src,
  video,
  alt,
  className,
  onError,
}: {
  src?: string;
  video?: boolean;
  alt?: string;
  className?: string;
  onError?: () => void;
}) {
  if (!src) return null;
  if (video) {
    return <video src={src} className={className} muted playsInline onError={onError} />;
  }
  return <img src={src} alt={alt ?? ""} className={className} onError={onError} />;
}
