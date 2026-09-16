import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { InstagramCenter } from "@/components/instagram/instagram-center";
import { PageHeader } from "@/components/shared/page-header";
import { AiCreativeModal } from "@/components/studio/ai-creative-modal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/instagram")({ component: InstagramRoute });

function InstagramRoute() {
  const [aiOpen, setAiOpen] = useState(false);
  const [topic, setTopic] = useState("延續 IG 歷史貼文語氣");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram Center"
        title="九宮格與 IG DNA"
        description="看即將上檔的格子、歷史貼文為什麼會被收藏，再把語氣帶回創作。"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/calendar">內容日曆</Link>
          </Button>
        }
      />
      <div className="mt-6">
        <InstagramCenter
          onUseAsTemplate={(post) => {
            setTopic(`延續 IG「${post.caption.slice(0, 18)}」的語氣`);
            setAiOpen(true);
          }}
        />
      </div>
      <AiCreativeModal open={aiOpen} onOpenChange={setAiOpen} initialTopic={topic} />
    </main>
  );
}
