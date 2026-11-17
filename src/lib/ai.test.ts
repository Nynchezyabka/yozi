import { describe, expect, it } from "vitest";
import { apiUrl, detectService, endpoint } from "./ai";

describe("ai key detection", () => {
  it("recognises providers by key prefix", () => {
    expect(detectService("sk-or-v1-abc")?.name).toBe("OpenRouter");
    expect(detectService("sk-ant-x")?.name).toBe("Anthropic");
    expect(detectService("AIzaXYZ")?.name).toBe("Google Gemini");
    expect(detectService("sk-" + "a".repeat(32))?.name).toBe("DeepSeek");
    expect(detectService("sk-proj-1")?.name).toBe("OpenAI");
    expect(detectService("hello")).toBeNull();
  });
  it("chosen model wins over the recommended one", () => {
    expect(endpoint({ apiKey: "sk-ant-x", model: "" })?.model).toBe("claude-haiku-4-5");
    expect(endpoint({ apiKey: "sk-ant-x", model: "claude-sonnet-4-5" })?.model).toBe("claude-sonnet-4-5");
  });
  it("own base URL is normalised", () => {
    expect(apiUrl("https://x.io/v1/", "openai")).toBe("https://x.io/v1/chat/completions");
    expect(endpoint({ apiKey: "sk-1", model: "m", baseUrl: "https://x.io" })?.url).toBe("https://x.io/v1/chat/completions");
  });
});
