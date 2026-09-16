export type CreateSearch = {
  mode?: string;
  idea?: string;
  asset?: string;
  campaign?: string;
};

/** Omit empty keys so optional search params stay out of the URL. */
export function createSearchParams(input: CreateSearch): CreateSearch {
  const next: CreateSearch = {};
  if (input.mode) next.mode = input.mode;
  if (input.idea) next.idea = input.idea;
  if (input.asset) next.asset = input.asset;
  if (input.campaign) next.campaign = input.campaign;
  return next;
}
