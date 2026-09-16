import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { finishOAuth } from "@/lib/connections/oauth";
import { Button } from "@/components/ui/button";

export function OAuthCallback({
  provider,
  code,
  state,
  error,
}: {
  provider: "canva" | "instagram";
  code: string;
  state: string;
  error?: string;
}) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("正在完成連接…");

  useEffect(() => {
    if (error) {
      setMessage("授權已取消。");
      return;
    }
    if (!code || !state) {
      setMessage("缺少授權資訊，請回連接頁再試一次。");
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await finishOAuth({ data: { provider, code, state } });
      if (cancelled) return;
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("已連接，正在回去。");
      void navigate({ to: "/connections" });
    })();
    return () => {
      cancelled = true;
    };
  }, [code, error, navigate, provider, state]);

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-2xl">{provider === "canva" ? "Canva" : "Instagram"}</p>
      <p className="mt-3 text-sm text-muted">{message}</p>
      <Button asChild variant="secondary" className="mt-6">
        <Link to="/connections">回連接</Link>
      </Button>
    </main>
  );
}
