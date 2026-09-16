import assert from "node:assert/strict";
import test from "node:test";
import { oauthStateMatches, publicOrigin, requestHost, requestProto } from "./origin.ts";

test("preview proxy forwarded host becomes the OAuth origin, not loopback", () => {
  const prev = process.env.VITE_PUBLIC_HOSTNAME;
  delete process.env.VITE_PUBLIC_HOSTNAME;
  try {
    const request = new Request("http://127.0.0.1:8080/api/connect/start/drive", {
      headers: {
        "x-forwarded-host": "zen.grok.me",
        "x-forwarded-proto": "https",
      },
    });
    assert.equal(requestHost(request), "zen.grok.me");
    assert.equal(requestProto(request), "https");
    assert.equal(publicOrigin(request), "https://zen.grok.me");
  } finally {
    if (prev === undefined) delete process.env.VITE_PUBLIC_HOSTNAME;
    else process.env.VITE_PUBLIC_HOSTNAME = prev;
  }
});

test("published grok.me host wins over Envoy loopback", () => {
  const prev = process.env.VITE_PUBLIC_HOSTNAME;
  process.env.VITE_PUBLIC_HOSTNAME = "tamkang-zen.grok.me";
  try {
    const request = new Request("http://127.0.0.1:8080/api/connect/callback/canva");
    assert.equal(publicOrigin(request), "https://tamkang-zen.grok.me");
  } finally {
    if (prev === undefined) delete process.env.VITE_PUBLIC_HOSTNAME;
    else process.env.VITE_PUBLIC_HOSTNAME = prev;
  }
});

test("oauth state must match the httpOnly cookie", () => {
  assert.equal(oauthStateMatches("abc", "abc"), true);
  assert.equal(oauthStateMatches("abc", "nope"), false);
  assert.equal(oauthStateMatches(null, "abc"), false);
});
