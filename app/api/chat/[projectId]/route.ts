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
import { prisma } from "@/lib/prisma";

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

    // Validate database type
    const dbType = project.dbType.toLowerCase();
    if (!["postgresql", "mysql", "mongodb"].includes(dbType)) {
      return NextResponse.json(
        {
          error: "Unsupported database type",
          message: `Database type '${project.dbType}' is not supported. Please use postgresql, mysql, or mongodb.`,
        },
        { status: 400 }
      );
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

    const dbUrl = await decrypt(project.encryptedDbUrl);

    const openrouter = createOpenRouter({
      apiKey: `${process.env.API_KEY_REF}`,
    });

    // Create database-specific tools and system prompt
    const result = streamText({
      model: openrouter("openai/gpt-4o-mini"),
      system: getSystemPrompt(
        typeof project.dbSummary === "string"
          ? project.dbSummary
          : JSON.stringify(project.dbSummary ?? ""),
        dbType as "postgresql" | "mysql" | "mongodb"
      ),
      messages: convertToModelMessages(allMessages),
      tools: createDatabaseTools(
        dbUrl,
        dbType as "postgresql" | "mysql" | "mongodb"
      ),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: allMessages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      messageMetadata({ part }) {
        if (part.type === "finish") {
          return {
            sessionId: session.id,
            projectId: project.id,
            dbType: project.dbType,
          };
        }
        return undefined;
      },
      onFinish: async ({ messages }) => {
        try {
          await saveMessages(session.id, messages);

          // Generate title for new conversations
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
            dbType: project.dbType,
          });
        } catch (error) {
          console.error("Error in onFinish:", error);
        }
      },
      headers: {
        "X-Session-Id": session.id,
        "X-Project-Id": project.id,
        "X-DB-Type": project.dbType,
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
  const { projectId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session");

  if (!sessionId) {
    return Response.json({ messages: [], title: null });
  }

  const user = await getAuthenticatedUser();
  const messages = await loadMessages(sessionId);
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { title: true }
  });

  return Response.json({ 
    messages, 
    title: session?.title 
  });
}
