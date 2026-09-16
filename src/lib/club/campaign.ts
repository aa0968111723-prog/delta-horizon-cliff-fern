export function campaignIdForUpsert(existingId?: string | null, inputId?: string | null) {
  if (existingId) return existingId;
  if (inputId) return inputId;
  return "";
}
