import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { AiCreativeModal } from "@/components/studio/ai-creative-modal";
import type { Campaign } from "@/lib/studio/campaign-types";

export const Route = createFileRoute("/calendar")({ component: CalendarRoute });

function CalendarRoute() {
  const [aiOpen, setAiOpen] = useState(false);
  const [topic, setTopic] = useState("09/24 浮游禪光 迎新茶會");
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  return (
    <>
      <CalendarPage
        onOpenAi={(nextTopic, nextCampaign) => {
          setTopic(nextTopic);
          setCampaign(nextCampaign ?? null);
          setAiOpen(true);
        }}
      />
      <AiCreativeModal open={aiOpen} onOpenChange={setAiOpen} initialTopic={topic} campaign={campaign} />
    </>
  );
}
