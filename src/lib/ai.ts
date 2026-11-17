// Bring-your-own-key AI: the key stays in this browser and requests go straight to the provider,
// so the app works on static hosting (Layero) without a server.
export type AiSettings = { apiKey: string; model: string; baseUrl?: string };
type Svc = { name: string; url: string; model: string; kind: "openai" | "anthropic" };
export type Endpoint = Svc & { key: string };

export const MODEL_OPTIONS: Record<string, { models: string[]; keysUrl: string }> = {
  OpenAI: { models: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1"], keysUrl: "https://platform.openai.com/api-keys" },
  Anthropic: { models: ["claude-haiku-4-5", "claude-sonnet-4-5"], keysUrl: "https://console.anthropic.com/settings/keys" },
  OpenRouter: { models: ["openai/gpt-4o-mini", "google/gemini-2.5-flash", "anthropic/claude-sonnet-4.5"], keysUrl: "https://openrouter.ai/settings/keys" },
  DeepSeek: { models: ["deepseek-chat", "deepseek-reasoner"], keysUrl: "https://platform.deepseek.com/api_keys" },
  Groq: { models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"], keysUrl: "https://console.groq.com/keys" },
  "Google Gemini": { models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"], keysUrl: "https://aistudio.google.com/apikey" },
  "Claude n Codex": { models: ["claude-sonnet-5", "claude-sonnet-4-6", "claude-opus-5.5"], keysUrl: "https://claude-n-codex.com/" },
  "xAI Grok": { models: ["grok-3-mini", "grok-3", "grok-4"], keysUrl: "https://console.x.ai" },
};

export function detectService(key: string): Svc | null {
  const k = key.trim();
  if (!k) return null;
  if (k.startsWith("sk-myapi_")) return { name: "Claude n Codex", url: "https://claude-n-codex.com:8443/v1/messages", model: "claude-sonnet-5", kind: "anthropic" };
  if (k.startsWith("sk-or-")) return { name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", model: "openai/gpt-4o-mini", kind: "openai" };
  if (k.startsWith("sk-ant-")) return { name: "Anthropic", url: "https://api.anthropic.com/v1/messages", model: "claude-haiku-4-5", kind: "anthropic" };
  if (k.startsWith("AIza")) return { name: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-2.5-flash", kind: "openai" };
  if (k.startsWith("gsk_")) return { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", kind: "openai" };
  if (k.startsWith("xai-")) return { name: "xAI Grok", url: "https://api.x.ai/v1/chat/completions", model: "grok-3-mini", kind: "openai" };
  if (/^sk-[a-f0-9]{32}$/.test(k)) return { name: "DeepSeek", url: "https://api.deepseek.com/chat/completions", model: "deepseek-chat", kind: "openai" };
  if (k.startsWith("sk-")) return { name: "OpenAI", url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", kind: "openai" };
  return null;
}

/** Normalises a pasted address (host, …/v1, full endpoint) to the request URL. */
export function apiUrl(base: string, format: "openai" | "anthropic") {
  let u = base.trim().replace(/\/+$/, "").replace(/\/(chat\/completions|messages)$/, "").replace(/\/+$/, "");
  if (!/\/v\d+[a-z]*$/i.test(u)) u += "/v1";
  return u + (format === "anthropic" ? "/messages" : "/chat/completions");
}

export function endpoint(ai: AiSettings): Endpoint | null {
  const key = ai.apiKey.trim();
  const svc = detectService(key);
  if (!svc) return null;
  const base = ai.baseUrl?.trim();
  return { ...svc, key, url: base ? apiUrl(base, svc.kind) : svc.url, model: ai.model.trim() || svc.model };
}

export type Msg = { role: "user" | "assistant"; content: string };
export async function chat(ep: Endpoint, system: string, messages: Msg[], maxTokens = 900): Promise<string> {
  const anth = ep.kind === "anthropic";
  let r: Response;
  try {
    r = await fetch(ep.url, {
      method: "POST",
      signal: AbortSignal.timeout(120000),
      headers: anth
        ? { "content-type": "application/json", "x-api-key": ep.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }
        : { "content-type": "application/json", authorization: `Bearer ${ep.key}` },
      body: JSON.stringify(anth
        ? { model: ep.model, max_tokens: maxTokens, system, messages }
        : { model: ep.model, max_tokens: maxTokens, messages: [{ role: "system", content: system }, ...messages] }),
    });
  } catch {
    throw new Error(`Нет связи с ${ep.name}. Проверьте интернет и адрес.`);
  }
  if (!r.ok) {
    const j = await r.json().catch(() => null);
    const d = String(j?.error?.message ?? j?.message ?? "").slice(0, 200);
    throw new Error(`${ep.name} ответил ошибкой ${r.status}${d ? `: ${d}` : ". Проверьте ключ."}`);
  }
  const j = await r.json();
  const text = anth ? j.content?.find?.((p: { type?: string }) => p.type === "text")?.text : j.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error(`${ep.name} прислал пустой ответ. Попробуйте другую модель.`);
  return text;
}
