export function driveQueryEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
