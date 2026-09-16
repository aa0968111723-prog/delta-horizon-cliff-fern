import { Button } from "@/components/ui/button";
import type { StudentReview } from "@/lib/studio/types";

export function StudentReviewCard({
  review,
  onApplyHook,
}: {
  review: StudentReview;
  onApplyHook?: (hook: string) => void;
}) {
  return (
    <section className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <h2 className="text-sm font-medium">淡江學生視角</h2>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        <li>會停下來嗎？{review.wouldStop}</li>
        <li>看得懂嗎？{review.understandable}</li>
        <li>太宗教？{review.tooReligious}</li>
        <li>太嚴肅？{review.tooSerious}</li>
        <li>太文青？{review.tooLiterary}</li>
        <li>太 AI？{review.tooAi}</li>
        <li>太長？{review.tooLong}</li>
        <li>知道這活動在幹嘛？{review.knowsWhat}</li>
        <li>知道時間地點嗎？{review.knowsWhenWhere}</li>
        <li>會找朋友嗎？{review.wouldBringFriend}</li>
        <li>知道怎麼報名嗎？{review.knowsHowToSignup}</li>
      </ul>
      {review.rewriteHook ? (
        <div className="mt-3">
          <p className="text-sm">可改 Hook：{review.rewriteHook}</p>
          {onApplyHook ? (
            <Button className="mt-3" size="sm" onClick={() => onApplyHook(review.rewriteHook)}>
              用這個 Hook 改寫
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
