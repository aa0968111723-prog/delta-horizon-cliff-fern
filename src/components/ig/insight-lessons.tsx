import { learnFromIg } from "@/lib/zen/insights";
import type { IgMemoryPost } from "@/lib/studio/types";

export function InsightLessons({ posts }: { posts: IgMemoryPost[] }) {
  const learning = learnFromIg(posts);
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium">下次怎麼寫比較有效</h2>
      <p className="mt-1 text-xs text-muted">不是報表牆。是給下一次創作用的記憶。</p>
      <ul className="mt-3 space-y-2">
        {learning.lessons.map((lesson) => (
          <li key={lesson.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-sm font-medium">{lesson.title}</p>
            <p className="mt-1 text-sm text-muted">{lesson.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
