import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  renderChristmasEmailHtml,
  getEmailConfigStatus,
  formatSmtpFrom,
} from "../email";

describe("email renderer", () => {
  it("escapes HTML and includes recipient, sender, and CTA link", () => {
    const html = renderChristmasEmailHtml({
      title: "Merry <Christmas>!",
      message: "첫째 줄\n둘째 줄 & 인사",
      senderName: "산타",
      recipientName: "루돌프",
      cardUrl: "https://xmas.example.com/c/card1?d=tok1",
      templateId: "classic-tree",
    });

    assert.match(html, /Merry &lt;Christmas&gt;!/);
    assert.match(html, /첫째 줄<br \/>둘째 줄 &amp; 인사/);
    assert.match(html, /루돌프/);
    assert.match(html, /산타/);
    assert.match(html, /https:\/\/xmas\.example\.com\/c\/card1\?d=tok1/);
  });

  it("formats display-only sender names into valid RFC From addresses", () => {
    assert.equal(
      formatSmtpFrom("전성열", "jeonsr@naver.com"),
      "\"전성열\" <jeonsr@naver.com>"
    );
    assert.equal(
      formatSmtpFrom("홍길동 <hong@gmail.com>", "hong@gmail.com"),
      "홍길동 <hong@gmail.com>"
    );
    assert.equal(formatSmtpFrom("", "user@naver.com"), "user@naver.com");
  });

  it("reports preview mode when no email credentials are configured", async () => {
    const status = await getEmailConfigStatus({
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
    });
    assert.equal(status.configured, false);
    assert.equal(status.provider, "preview");
  });
});
