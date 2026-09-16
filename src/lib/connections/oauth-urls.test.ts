import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCanvaAuthorizeUrl,
  buildInstagramAuthorizeUrl,
  CANVA_SCOPES,
  hasInsightsGrant,
  IG_INSIGHTS_SCOPE,
  parseInstagramTokenPayload,
  splitScopes,
} from "./oauth-urls.ts";

test("Canva authorize URL is official Connect PKCE with read-only design scopes", () => {
  const url = new URL(buildCanvaAuthorizeUrl({
    clientId: "canva-client",
    redirectUri: "https://zen.example/api/canva/callback",
    challenge: "abc",
    state: "state-1",
  }));
  assert.equal(url.hostname, "www.canva.com");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("scope"), CANVA_SCOPES);
  assert.equal(url.searchParams.get("client_id"), "canva-client");
  assert.equal(url.toString().includes("client_secret"), false);
});

test("Instagram authorize URL uses Instagram Login, not Facebook login, and keeps insights optional", () => {
  const basic = new URL(buildInstagramAuthorizeUrl({
    clientId: "ig-app",
    redirectUri: "https://zen.example/api/instagram/callback",
    challenge: "xyz",
    state: "state-2",
  }));
  assert.equal(basic.searchParams.get("enable_fb_login"), "0");
  assert.equal(basic.searchParams.get("scope"), "instagram_business_basic");
  assert.equal(basic.searchParams.get("code_challenge_method"), "S256");

  const insights = new URL(buildInstagramAuthorizeUrl({
    clientId: "ig-app",
    redirectUri: "https://zen.example/api/instagram/callback",
    challenge: "xyz",
    state: "state-2",
    includeInsights: true,
  }));
  assert.match(insights.searchParams.get("scope") ?? "", /instagram_business_manage_insights/);
  assert.equal(hasInsightsGrant(splitScopes(insights.searchParams.get("scope") ?? "")), true);
  assert.equal(hasInsightsGrant(["instagram_business_basic"]), false);
  assert.equal(IG_INSIGHTS_SCOPE, "instagram_business_manage_insights");
});

test("parses Instagram Login nested token payloads without inventing scopes", () => {
  const nested = parseInstagramTokenPayload({
    data: [{
      access_token: "IGQVJnested",
      user_id: "17841",
      permissions: "instagram_business_basic,instagram_business_manage_insights",
    }],
  });
  assert.equal(nested?.accessToken, "IGQVJnested");
  assert.equal(nested?.userId, "17841");
  assert.equal(hasInsightsGrant(nested?.scopes ?? []), true);

  const flat = parseInstagramTokenPayload({ access_token: "IGQVJflat", user_id: 99 });
  assert.equal(flat?.accessToken, "IGQVJflat");
  assert.deepEqual(flat?.scopes, []);

  assert.equal(parseInstagramTokenPayload({ error: "nope" }), null);
});
