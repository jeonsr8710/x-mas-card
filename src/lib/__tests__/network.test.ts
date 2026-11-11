import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isLocalhostUrl, resolveShareBaseUrl } from "../network";

describe("network baseUrl resolution", () => {
  it("identifies localhost URLs accurately", () => {
    assert.equal(isLocalhostUrl("http://localhost:3000"), true);
    assert.equal(isLocalhostUrl("http://127.0.0.1:3000"), true);
    assert.equal(isLocalhostUrl("http://192.168.0.33:3000"), false);
    assert.equal(isLocalhostUrl("https://xmas.example.com"), false);
  });

  it("prefers explicit non-localhost configured baseUrl", () => {
    const req = new Request("http://localhost:3000/api/config/status");
    const res = resolveShareBaseUrl(req, "https://xmas.example.com/");
    assert.equal(res.baseUrl, "https://xmas.example.com");
    assert.equal(res.mode, "public");
  });

  it("upgrades localhost to LAN IP instead of returning localhost for QR", () => {
    const req = new Request("http://localhost:3000/api/config/status");
    const res = resolveShareBaseUrl(req, "http://localhost:3000");
    assert.equal(isLocalhostUrl(res.baseUrl) && res.mode === "lan", false);
  });
});
