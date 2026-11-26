import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseBrain } from "../src/lib/brain/types.ts";

const openai = (baseUrl) => ({ provider: "openai", key: "sk-test", model: "model-x", baseUrl });

describe("parseBrain (llm)", () => {
  it("accepts anthropic and trims key", () => {
    assert.deepEqual(
      parseBrain({ provider: "anthropic", key: " sk-ant-1 ", model: "claude-haiku-5-5", baseUrl: "http://evil" }),
      { provider: "anthropic", key: "sk-ant-1", model: "claude-haiku-5-5" },
    );
  });

  it("rejects bad shapes, keys, models, and unsafe openai baseUrls", () => {
    for (const v of [null, undefined, "x", 1, [], { provider: "gemini", key: "k", model: "m" }]) {
      assert.equal(parseBrain(v), null);
    }
    assert.equal(parseBrain({ provider: "anthropic", key: "", model: "m" }), null);
    assert.equal(parseBrain({ provider: "anthropic", key: "a b", model: "m" }), null);
    assert.equal(parseBrain({ provider: "anthropic", key: "k", model: "bad model!" }), null);
    assert.equal(parseBrain(openai("https://api.openai.com/v1/"))?.baseUrl, "https://api.openai.com/v1");
    for (const u of [
      "",
      "http://api.openai.com/v1",
      "https://localhost/v1",
      "https://box.local/v1",
      "https://db.internal/v1",
      "https://127.0.0.1/v1",
      "https://169.254.169.254/latest",
      "https://[::1]/v1",
      "https://user:pw@api.openai.com/v1",
      "not a url",
    ]) {
      assert.equal(parseBrain(openai(u)), null);
    }
  });
});
