import type { AICapability } from "@/types";

interface AIConfig {
  provider: "openai" | "claude" | "ollama" | "custom";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export async function runAICapability(
  capability: AICapability,
  content: string,
  config: AIConfig
): Promise<string> {
  const systemPrompts: Record<string, string> = {
    suggest: "You are a writing assistant. Suggest the next paragraph continuation for the given text. Return only the suggested continuation, no commentary.",
    rewrite: "You are a writing assistant. Rewrite the given text to improve clarity, flow, and style while preserving the author's voice. Return only the rewritten text.",
    translate: `You are a professional translator. Translate the given text to ${capability.targetLanguage ?? "English"}. Return only the translation.`,
    expand: "You are a writing assistant. Expand the given text with more detail, description, and depth. Return only the expanded text.",
    grammar: "You are a grammar and style editor. Fix grammar, punctuation, and style issues in the given text. Return only the corrected text.",
    style: "You are a writing coach. Adjust the style of the given text to be more engaging and literary. Return only the adjusted text.",
    tone: "You are a writing coach. Adjust the tone of the given text based on the context. Return only the adjusted text.",
    extract_characters: "You are a literary analyst. Extract all character names and brief descriptions from the given text. Return a JSON array of objects with fields: name, description, traits (array), role.",
    extract_worldbuilding: "You are a literary analyst. Extract worldbuilding elements (locations, lore, timeline events, world rules) from the given text. Return a JSON array of objects with fields: type (LOCATION|LORE|TIMELINE|RULE), title, content.",
    generate_chapter: "You are a creative writing assistant. Generate a full chapter based on the given context and instructions. Return only the chapter content.",
    analyze: "You are a literary analyst. Analyze the given text for genre, tone, structure, and style. Return a JSON object with fields: genre, tone, structure, style, suggestions.",
  };

  const systemPrompt = systemPrompts[capability.type] ?? "You are a writing assistant.";
  const userContent = capability.prompt
    ? `${capability.prompt}\n\n---\n\n${content}`
    : content;

  if (config.provider === "openai") {
    return callOpenAI(systemPrompt, userContent, config);
  } else if (config.provider === "claude") {
    return callClaude(systemPrompt, userContent, config);
  } else if (config.provider === "ollama" || config.provider === "custom") {
    return callOpenAICompatible(systemPrompt, userContent, config);
  }

  throw new Error("Unsupported AI provider");
}

async function callOpenAI(
  system: string,
  content: string,
  config: AIConfig
): Promise<string> {
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: config.apiKey });
  const response = await client.chat.completions.create({
    model: config.model ?? "gpt-4o",
    messages: [
      { role: "system", content: system },
      { role: "user", content },
    ],
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content ?? "";
}

async function callClaude(
  system: string,
  content: string,
  config: AIConfig
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: config.apiKey });
  const response = await client.messages.create({
    model: config.model ?? "claude-opus-4-6",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

async function callOpenAICompatible(
  system: string,
  content: string,
  config: AIConfig
): Promise<string> {
  const { OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: config.apiKey ?? "ollama",
    baseURL: config.baseUrl ?? "http://localhost:11434/v1",
  });
  const response = await client.chat.completions.create({
    model: config.model ?? "llama3.2",
    messages: [
      { role: "system", content: system },
      { role: "user", content },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}
