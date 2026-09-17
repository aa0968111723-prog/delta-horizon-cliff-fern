export function exportFilename(
  name: string,
  short: string,
  suffix = "",
  width?: number,
  height?: number,
  ext = "png",
) {
  const size = width && height ? `-${width}x${height}` : "";
  return `${name}-${short}${suffix}${size}.${ext}`;
}
