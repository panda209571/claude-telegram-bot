import OpenAI from "openai";

const MODEL = "anthropic/claude-opus-4.7";

if (!process.env["OPENROUTER_API_KEY"]) {
  throw new Error("OPENROUTER_API_KEY environment variable is required.");
}

const client = new OpenAI({
  apiKey: process.env["OPENROUTER_API_KEY"],
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://render.com",
    "X-Title": "Telegram AI Bot",
  },
});

type Message = { role: "user" | "assistant" | "system"; content: string };

const conversationHistory = new Map<number, Message[]>();

export async function chat(userId: number, userMessage: string): Promise<string> {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, [
      {
        role: "system",
        content:
          "You are a helpful, intelligent assistant. Be concise but thorough in your answers. You are running inside a Telegram bot.",
      },
    ]);
  }

  const history = conversationHistory.get(userId)!;
  history.push({ role: "user", content: userMessage });

  if (history.length > 41) {
    const systemMsg = history[0];
    history.splice(1, history.length - 41);
    history[0] = systemMsg!;
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8192,
    messages: history,
  });

  const assistantMessage =
    response.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";

  history.push({ role: "assistant", content: assistantMessage });
  return assistantMessage;
}

export function clearHistory(userId: number) {
  conversationHistory.delete(userId);
}

export function getHistoryLength(userId: number): number {
  const h = conversationHistory.get(userId);
  if (!h) return 0;
  return Math.max(0, h.length - 1);
}
