import { useEffect, type ReactNode } from "react";
import { hydrateSeedAsset } from "@/lib/studio/assets-idb";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function StudioProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await useStudio.persist.rehydrate();
      } finally {
        if (!cancelled) useStudio.getState().setHydrated(true);
        const assets = useStudio.getState().assets;
        void Promise.all(
          assets.map(async (asset) => {
            if (!asset.seedSrc) return;
            try {
              await hydrateSeedAsset(asset.id, asset.seedSrc);
            } catch {
              /* seed fetch may fail offline */
            }
          }),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let timer = 0;
    const unsub = useStudio.subscribe((state, prev) => {
      if (!state.hydrated) return;
      if (
        state.campaigns === prev.campaigns &&
        state.schedule === prev.schedule &&
        state.projects === prev.projects &&
        state.brands === prev.brands &&
        state.assets === prev.assets
      ) {
        return;
      }
      useUi.getState().setSaveStatus("saving");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        useUi.getState().setSaveStatus("saved");
      }, 420);
    }
    const unsubStudio = useStudio.subscribe((state, prev) => {
      if (!state.hydrated) return;
      if (state.projects === prev.projects && state.brands === prev.brands && state.assets === prev.assets) return;
      ping();
    });
    const unsubCreative = useCreative.subscribe((state, prev) => {
      if (!state.hydrated) return;
      if (
        state.campaigns === prev.campaigns &&
        state.schedule === prev.schedule &&
        state.connections === prev.connections
      ) {
        return;
      }
      ping();
    });
    return () => {
      unsubStudio();
      unsubCreative();
      window.clearTimeout(timer);
    };
  }, []);

  return children;
}
