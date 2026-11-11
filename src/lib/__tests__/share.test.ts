import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCardUrl,
  buildKakaoSharePayload,
  buildSmsUri,
  isValidEmail,
  normalizePhone,
} from "../share";

describe("share helpers", () => {
  it("builds personalized and public card URLs cleanly", () => {
    assert.equal(
      buildCardUrl("https://xmas.example.com/", "abc123"),
      "https://xmas.example.com/c/abc123"
    );
    assert.equal(
      buildCardUrl("https://xmas.example.com", "abc123", "tok999"),
      "https://xmas.example.com/c/abc123?d=tok999"
    );
  });

  it("normalizes phone numbers and builds sms: URI", () => {
    assert.equal(normalizePhone("010-1234-5678"), "01012345678");
    const uri = buildSmsUri({
      phone: "010-1234-5678",
      recipientName: "민수",
      senderName: "영희",
      title: "메리 크리스마스!",
      cardUrl: "https://xmas.example.com/c/abc?d=1",
    });
    assert.equal(uri.startsWith("sms:01012345678?body="), true);
    const decoded = decodeURIComponent(uri.split("?body=")[1]);
    assert.match(decoded, /민수님, 영희님이/);
    assert.match(decoded, /https:\/\/xmas\.example\.com\/c\/abc\?d=1/);

    const noPhoneUri = buildSmsUri({
      senderName: "영희",
      title: "메리 크리스마스!",
      cardUrl: "https://xmas.example.com/c/abc",
    });
    assert.equal(noPhoneUri.startsWith("sms:?body="), true);
  });

  it("validates email addresses", () => {
    assert.equal(isValidEmail("user@example.com"), true);
    assert.equal(isValidEmail("invalid-email"), false);
    assert.equal(isValidEmail("user@"), false);
  });

  it("builds Kakao feed share payload", () => {
    const payload = buildKakaoSharePayload({
      title: "행복한 성탄절",
      senderName: "지훈",
      recipientName: "수진",
      message: "올 한 해도 고마웠어요! 따뜻한 연말 보내세요.",
      cardUrl: "https://xmas.example.com/c/xyz?d=123",
      imageUrl: "https://xmas.example.com/c/xyz/opengraph-image",
    });

    assert.equal(payload.objectType, "feed");
    assert.match(payload.content.title, /행복한 성탄절/);
    assert.match(payload.content.description, /To\. 수진/);
    assert.equal(payload.content.imageWidth, 1200);
    assert.equal(payload.content.imageHeight, 600);
    assert.equal(
      payload.content.link.webUrl,
      "https://xmas.example.com/c/xyz?d=123"
    );
    assert.equal(payload.buttons[0].title, "온라인카드 열어보기");
  });
});
