import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inspectProject } from "@/lib/studio/quality";
import { pagesOf } from "@/lib/studio/layers";
import type { BrandKit, Project, QaIssue } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function QualityPanel({ project, brand }: { project: Project; brand: BrandKit }) {
  const select = useStudio((s) => s.select);
  const setSlide = useStudio((s) => s.setSlide);
  const applyQaFix = useStudio((s) => s.applyQaFix);
  const applyQaFixes = useStudio((s) => s.applyQaFixes);
  const pages = pagesOf(project);
  const report = inspectProject(pages, brand, project.copy);
  const tone = report.score >= 85 ? "text-success" : report.score >= 70 ? "text-warn" : "text-danger";
  const problems = report.issues.filter((i) => i.severity !== "pass");

  function jump(issue: QaIssue) {
    if (issue.pageIndex >= 0) setSlide(project.id, issue.pageIndex);
    select(issue.layerId ?? null);
  }

  function fixOne(issue: QaIssue) {
    const ok = applyQaFix(project.id, issue);
    if (ok) toast.success(`已修正「${issue.title}」，原版在版本列表`);
    else toast.message("這則需要手動調整");
  }

  function fixAll() {
    const n = applyQaFixes(project.id);
    if (n) toast.success(`已自動修正 ${n} 則，原版在版本列表`);
    else toast.message("目前沒有可自動修正的項目");
  }

  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <p className="text-xs text-muted">品質檢查</p>
        <p className={cn("font-display text-4xl tabular-nums tracking-tight", tone)} data-testid="qa-score">
          {report.score}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{report.summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2" data-testid="qa-checklist">
        {report.checks.map((check) => (
          <div
            key={check.id}
            className="flex min-h-11 items-center justify-between gap-2 rounded-md bg-bg px-3 text-xs"
          >
            <span>{check.label}</span>
            <span
              className={cn(
                "tabular-nums",
                check.status === "fail" && "text-danger",
                check.status === "warn" && "text-warn",
                check.status === "pass" && "text-success",
              )}
            >
              {check.status === "pass" ? "通過" : check.status === "fail" ? "必須修" : "建議"}
            </span>
          </div>
        ))}
      </div>

      {report.fixable > 0 ? (
        <Button className="min-h-11 w-full" onClick={fixAll} data-testid="qa-fix-all">
          一鍵修正 {report.fixable} 則
        </Button>
      ) : null}

      <ul className="space-y-2">
        {problems.length === 0 ? (
          <li className="rounded-lg bg-success/10 px-3 py-3 text-sm">13 項都通過。匯出前仍請看一次縮圖。</li>
        ) : (
          problems.map((issue) => (
            <li key={issue.id}>
              <div
                className={cn(
                  "rounded-lg px-3 py-3 shadow-[var(--shadow-border)]",
                  issue.severity === "fail" && "bg-danger/10",
                  issue.severity === "warn" && "bg-warn/10",
                )}
              >
                <button type="button" className="w-full text-left" onClick={() => jump(issue)}>
                  <p className="text-xs tracking-wide text-muted">
                    {issue.severity === "fail" ? "必須修正" : "建議"} · {issue.location}
                    {pages[issue.pageIndex]?.role ? "" : ""}
                  </p>
                  <p className="mt-1 text-sm font-medium">{issue.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{issue.detail}</p>
                  <p className="mt-2 text-xs leading-relaxed">{issue.suggestion}</p>
                </button>
                {issue.fix ? (
                  <Button
                    size="sm"
                    className="mt-3 min-h-11"
                    variant="secondary"
                    data-testid={`qa-fix-${issue.check}`}
                    onClick={() => {
                      jump(issue);
                      fixOne(issue);
                    }}
                  >
                    {issue.fixLabel || "一鍵修正"}
                  </Button>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
      <p className="text-xs text-muted">修正前會先存一版「修正前 · 品質檢查」，可在版本列表還原。</p>
    </div>
  );
}
