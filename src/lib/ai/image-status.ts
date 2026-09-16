export type ImageAiStatus = {
  available: boolean;
  label: string;
  detail: string;
  generateBlockedMessage: string;
};

export function describeImageAdapter(available: boolean): ImageAiStatus {
  if (available) {
    return {
      available: true,
      label: "已連線圖片生成",
      detail: "按下生成才會呼叫 Grok Imagine，每小時最多四張。不會假裝已發到 Instagram。",
      generateBlockedMessage: "",
    };
  }
  return {
    available: false,
    label: "圖片服務尚未開放",
    detail: "這個環境沒有開放 AI 圖片。按下生成不會做出假圖，也不會假裝 Grok 已畫好畫面。既有上傳、畫布與模板仍可用。",
    generateBlockedMessage: "這個環境尚未開放 AI 圖片服務。沒有生成任何畫面，也不會假裝 Grok 已畫好。",
  };
}

export function createImageQuota(limit = 4, windowMs = 60 * 60 * 1000) {
  let start = 0;
  let count = 0;
  return {
    consume() {
      const now = Date.now();
      if (now - start > windowMs) {
        start = now;
        count = 0;
      }
      if (count >= limit) {
        return {
          ok: false as const,
          error: `圖片生成已達本時段上限（${limit} 張）。這是為了保護額度，不是模擬失敗。`,
        };
      }
      count += 1;
      return { ok: true as const };
    },
    refund() {
      count = Math.max(0, count - 1);
    },
    used() {
      return count;
    },
  };
}
