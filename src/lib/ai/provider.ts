export type LlmProviderName = "groq" | "gemini";

export interface LlmCompletion {
  text: string;
  provider: LlmProviderName;
  model: string;
  latencyMs: number;
}

export interface CompleteOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const TIMEOUT_MS = 12_000;

export function aiStatus() {
  return {
    groq: Boolean(process.env.GROQ_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    mode:
      process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
        ? ("live" as const)
        : ("heuristic" as const),
  };
}

async function callGroq(options: CompleteOptions): Promise<LlmCompletion | null> {
  if (!process.env.GROQ_API_KEY) return null;
  const startedAt = Date.now();
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: options.temperature ?? 0,
        max_tokens: options.maxTokens ?? 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.user },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    return { text, provider: "groq", model: GROQ_MODEL, latencyMs: Date.now() - startedAt };
  } catch {
    return null;
  }
}

async function callGemini(options: CompleteOptions): Promise<LlmCompletion | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  const startedAt = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.system }] },
          contents: [{ role: "user", parts: [{ text: options.user }] }],
          generationConfig: {
            temperature: options.temperature ?? 0,
            maxOutputTokens: options.maxTokens ?? 400,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return {
      text,
      provider: "gemini",
      model: GEMINI_MODEL,
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return null;
  }
}

export async function completeJson(
  options: CompleteOptions,
): Promise<LlmCompletion | null> {
  return (await callGroq(options)) ?? (await callGemini(options));
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
