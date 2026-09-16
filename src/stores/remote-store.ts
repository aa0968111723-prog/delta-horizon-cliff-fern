import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProviderId } from "@/lib/connections/providers";
import type { RemoteItem } from "@/lib/connections/remote";

type RemoteState = {
  items: RemoteItem[];
  setItems: (provider: ProviderId, items: RemoteItem[]) => void;
  clear: (provider: ProviderId) => void;
};

export const useRemote = create<RemoteState>()(
  persist(
    (set) => ({
      items: [],
      setItems: (provider, items) =>
        set((s) => ({
          items: [...s.items.filter((item) => item.provider !== provider), ...items],
        })),
      clear: (provider) => set((s) => ({ items: s.items.filter((item) => item.provider !== provider) })),
    }),
    { name: "tku-zen-remote-v1" },
  ),
);
