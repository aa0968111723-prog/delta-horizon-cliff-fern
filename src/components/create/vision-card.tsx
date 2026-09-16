import type { VisionAnalysis } from "@/lib/ai/image-studio";

export function VisionCard({ vision, children }: { vision: VisionAnalysis; children?: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]" data-testid="vision-card">
      <h2 className="text-sm font-medium">圖片理解</h2>
      <p className="mt-2">{vision.content}</p>
      <ul className="mt-3 space-y-1 text-xs text-muted">
        <li>人物：{vision.people}</li>
        <li>色彩：{vision.colors}</li>
        <li>光線：{vision.lighting}</li>
        <li>構圖：{vision.composition}</li>
        <li>文字比例：{vision.textRatio}</li>
        <li>視覺層級：{vision.hierarchy}</li>
        <li>品牌感：{vision.brandFeel}</li>
        <li>學生感：{vision.studentFeel}</li>
        <li>停留感：{vision.dwell}</li>
        <li data-testid="vision-flags">
          太宗教？{vision.tooReligious ? "是" : "否"} · 太老氣？{vision.tooOld ? "是" : "否"} · 太 AI？
          <span data-testid="vision-too-ai">{vision.tooAi ? "可能" : "還好"}</span>
        </li>
        <li>符合淡江學生？{vision.fitsTamkang ? "接近" : "還要再生活一點"}</li>
      </ul>
      {vision.suggestions.length ? (
        <ul className="mt-2 list-disc pl-4 text-sm">
          {vision.suggestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {children}
    </section>
  );
}
