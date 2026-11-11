import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { summarizeSettings, type EffectiveSettings } from "../settings";

const emptySettings: EffectiveSettings = {
  baseUrl: "",
  kakaoJsKey: "",
  emailProvider: "smtp",
  smtpHost: "",
  smtpPort: "587",
  smtpSecure: false,
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
  resendApiKey: "",
  resendFrom: "",
  solapiApiKey: "",
  solapiApiSecret: "",
  solapiSenderPhone: "",
};

describe("settings summary", () => {
  it("detects unconfigured state cleanly", () => {
    const summary = summarizeSettings(emptySettings);
    assert.equal(summary.emailConfigured, false);
    assert.equal(summary.activeEmailMethod, "preview");
    assert.equal(summary.kakaoConfigured, false);
    assert.equal(summary.smsApiConfigured, false);
  });

  it("detects SMTP, Kakao, and Solapi configuration when provided", () => {
    const summary = summarizeSettings({
      ...emptySettings,
      kakaoJsKey: "kakao_key_123",
      smtpHost: "smtp.gmail.com",
      smtpUser: "me@gmail.com",
      smtpPass: "app-pass",
      solapiApiKey: "NCS123",
      solapiApiSecret: "SECRET123",
      solapiSenderPhone: "01012345678",
    });

    assert.equal(summary.emailConfigured, true);
    assert.equal(summary.activeEmailMethod, "smtp");
    assert.equal(summary.kakaoConfigured, true);
    assert.equal(summary.smsApiConfigured, true);
  });
});
