export type IgSearch = {
  posted?: string;
  campaign?: string;
};

export function igSearchParams(input: IgSearch): IgSearch {
  const next: IgSearch = {};
  if (input.posted) next.posted = input.posted;
  if (input.campaign) next.campaign = input.campaign;
  return next;
}
