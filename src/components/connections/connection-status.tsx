import { Badge } from "@/components/ui/badge";
import type { ConnectorUiState } from "@/lib/connections/types";

export function ConnectionBadge({ status }: { status: ConnectorUiState }) {
  if (status === "connected") return <Badge variant="success">Connected</Badge>;
  if (status === "checking") return <Badge variant="default">Checking</Badge>;
  if (status === "login") return <Badge variant="warn">需要授權</Badge>;
  if (status === "idle") return <Badge variant="default">尚未檢查</Badge>;
  if (status === "unavailable") return <Badge variant="default">尚未提供</Badge>;
  return <Badge variant="danger">未連接</Badge>;
}

export function ConnectionMessage({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-6 text-center md:p-10">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">{detail}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function openExternalUrl(url: string) {
  try {
    if (window.self !== window.top) {
      const opened = window.open(url, "_blank");
      if (opened) {
        opened.opener = null;
        return true;
      }
    }
  } catch {
    /* framed access can throw */
  }
  window.location.assign(url);
  return true;
}
