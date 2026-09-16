#!/bin/sh
# 平台在 hibernate/revive 之後會跑這支，把預覽用的 dev server 帶回來。
# 必須 idempotent 且不阻塞：健康就直接離開，只啟動沒在跑的東西。
set -eu
cd /workspace

node scripts/preview.mjs stop || true

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi

# reboot 有可能把 node_modules 清掉，沒有的話先裝再啟動。
if [ ! -d node_modules/vite ]; then
  npm install >>/tmp/app-startup.log 2>&1 || true
fi

# 只能用 npm run dev：只有 npm script 會把 .grok/app-env.json 併進環境。
npm run dev >>/tmp/app-startup.log 2>&1 &
