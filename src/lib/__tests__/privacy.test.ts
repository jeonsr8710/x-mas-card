import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskEmail, maskPhone, maskTargetAddress } from "../privacy";
import { isPublicViewerOnly } from "../mode";

describe("privacy masking & mode helpers", () => {
  it("masks email addresses while keeping domain readable", () => {
    assert.equal(maskEmail("jeonsr8710@gmail.com"), "je********@gmail.com");
    assert.equal(maskEmail("ab@naver.com"), "ab**@naver.com");
  });

  it("masks phone numbers", () => {
    assert.equal(maskPhone("010-1234-5678"), "010-****-5678");
    assert.equal(maskPhone("01012345678"), "010-****-5678");
    assert.equal(maskPhone("1234"), "***");
  });

  it("masks target addresses by channel", () => {
    assert.equal(
      maskTargetAddress("EMAIL", "user@example.com"),
      "us**@example.com"
    );
    assert.equal(maskTargetAddress("SMS", "01099998888"), "010-****-8888");
    assert.equal(maskTargetAddress("SMS", ""), null);
  });

  it("detects public viewer mode accurately", () => {
    const prevPublic = process.env.PUBLIC_VIEWER_ONLY;
    const prevVercel = process.env.VERCEL;
    try {
      delete process.env.PUBLIC_VIEWER_ONLY;
      delete process.env.VERCEL;
      assert.equal(isPublicViewerOnly(), false);

      process.env.VERCEL = "1";
      assert.equal(isPublicViewerOnly(), true);

      process.env.PUBLIC_VIEWER_ONLY = "false";
      assert.equal(isPublicViewerOnly(), false);

      delete process.env.VERCEL;
      process.env.PUBLIC_VIEWER_ONLY = "true";
      assert.equal(isPublicViewerOnly(), true);
    } finally {
      if (prevPublic === undefined) delete process.env.PUBLIC_VIEWER_ONLY;
      else process.env.PUBLIC_VIEWER_ONLY = prevPublic;
      if (prevVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prevVercel;
    }
  });
});
