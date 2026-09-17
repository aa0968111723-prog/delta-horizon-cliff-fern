export function useCampaignStore<T>(selector: (s: { addScheduledPost: (...args: unknown[]) => void }) => T): T {
  return selector({
    addScheduledPost: () => undefined,
  });
}
