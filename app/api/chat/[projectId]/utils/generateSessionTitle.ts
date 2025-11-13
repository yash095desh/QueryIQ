import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { UIMessage } from "ai";
import { extractTextContent } from "./dbHelpers";

const openrouter = createOpenRouter({
  apiKey: process.env.API_KEY_REF!,
});

export async function generateSessionTitle(responseMessage: UIMessage) {
  const messageText = extractTextContent(responseMessage?.parts);

  if (!messageText) return "New Conversation";

  const { text } = await generateText({
    model: openrouter("openai/gpt-4o-mini"),
    prompt: `Generate a concise, 3–6 word title summarizing this assistant response:\n\n${messageText}`,
  });

  return text.trim();
}

