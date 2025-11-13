import { decrypt } from "@/lib/encryption";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  UIMessage,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import getProjectDetails from "./utils/getProjectDetails";
import { createDatabaseTools, getSystemPrompt } from "./utils/tools";
import { NextRequest, NextResponse } from "next/server";
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
  ctx: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await ctx.params;
    const user = await getAuthenticatedUser();
    const project = await getProjectDetails(projectId);

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
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
      originalMessages: allMessages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      messageMetadata({ part }) {
        if (part.type === "finish") {
          return { sessionId: session.id, projectId: project.id };
        }
        return undefined;
      },
      onFinish: async ({ messages }) => {
        try {
          await saveMessages(session.id, messages);

          if (conversationHistory.length === 0 && messages.length > 0) {
            const firstUserMessage = messages.find(
              (m: any) => m.role === "user"
            );
            if (firstUserMessage) {
              const title = await generateSessionTitle(firstUserMessage);
              await updateSessionTitle(session.id, title);
            }
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
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();
    const project = await getProjectDetails(projectId);
    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const messages: UIMessage[] = await loadMessages(sessionId);
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("Error while fetching chat messages:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
