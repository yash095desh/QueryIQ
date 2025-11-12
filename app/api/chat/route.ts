import { decrypt } from "@/lib/encryption";
import { convertToModelMessages, streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import getProjectDetails from "./utils/getProjectDetails";
import { createDatabaseTools, getSystemPrompt } from "./utils/tools";
import { NextRequest } from "next/server";
import {
  getOrCreateSession,
  loadMessages,
  saveMessages,
  updateSessionTitle,
} from "./utils/dbHelpers";
import { generateSessionTitle } from "./utils/generateSessionTitle";

export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getAuthenticatedUser();
  const project = await getProjectDetails(params.projectId);

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const { messages, sessionId } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response("Invalid request: messages array required", {
      status: 400,
    });
  }

  const session = await getOrCreateSession(user.id, project.id, sessionId);

  const conversationHistory = await loadMessages(session.id);

  const allMessages = [...conversationHistory, ...messages];

  const dbUrl = await decrypt(project?.encryptedDbUrl);

  const openrouter = createOpenRouter({
    apiKey: `${process.env.API_KEY_REF}`,
  });

  const result = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    system: getSystemPrompt(
      typeof project.dbSummary === "string"
        ? project.dbSummary
        : JSON.stringify(project.dbSummary ?? "")
    ),
    messages: convertToModelMessages(allMessages),
    tools: createDatabaseTools(dbUrl),
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ messages, responseMessage }) => {
      try {
        await saveMessages(session.id, messages);

        // Auto-generate title for new sessions
        if (conversationHistory.length === 0) {
          const title = await generateSessionTitle(responseMessage);
          await updateSessionTitle(session.id, title);
        }

        console.log("Messages saved:", {
          sessionId: session.id,
          messageCount: messages.length,
        });
      } catch (error) {
        console.error("Error in onFinish:", error);
      }
    },
    headers: {
      "X-Session-Id": session.id,
      "X-Project-Id": project.id,
    },
  });
}
