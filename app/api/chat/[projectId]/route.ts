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
  createDbConnection,
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
  let dbConnection: Awaited<ReturnType<typeof createDbConnection>> | null = null;

  try {
    const { projectId } = await ctx.params;
    console.log(`[chat] POST projectId=${projectId}`);
    const user = await getAuthenticatedUser();
    console.log(`[chat] user=${user.id}`);
    const project = await getProjectDetails(projectId);

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Validate and normalize database type ("postgres" → "postgresql")
    const rawDbType = project.dbType.toLowerCase();
    const dbType = rawDbType === "postgres" ? "postgresql" : rawDbType;
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
    console.log(`[chat] session=${session.id} (${sessionId ? 'existing' : 'new'})`);
    const conversationHistory = await loadMessages(session.id);
    const allMessages = [...conversationHistory, ...messages];
    console.log(`[chat] history=${conversationHistory.length} + new=${messages.length}`);

    const dbUrl = await decrypt(project.encryptedDbUrl);

    // Create ONE connection for the entire request — shared across all tool calls
    const typedDbType = dbType as "postgresql" | "mysql" | "mongodb";
    console.log(`[chat] connecting to ${typedDbType} db...`);
    dbConnection = await createDbConnection(dbUrl, typedDbType);
    console.log(`[chat] db connected`);

    const openrouter = createOpenRouter({
      apiKey: `${process.env.API_KEY_REF}`,
    });

    // Use the compressed AI summary for the system prompt (not raw JSON schema)
    const systemPromptSummary = typeof project.dbSummary === "string"
      ? project.dbSummary
      : JSON.stringify(project.dbSummary ?? "");

    const result = streamText({
      model: openrouter("openai/gpt-4o-mini"),
      system: getSystemPrompt(systemPromptSummary, typedDbType),
      messages: convertToModelMessages(allMessages),
      tools: createDatabaseTools(dbConnection, typedDbType),
    });

    // Capture connection ref for cleanup in onFinish
    const connRef = dbConnection;

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
        console.log(`[chat] stream finished, closing db connection`);
        await connRef.close();

        try {
          await saveMessages(session.id, messages);
          console.log(`[chat] saved ${messages.length} messages to session=${session.id}`);

          if (conversationHistory.length === 0 && messages.length > 0) {
            const firstUserMessage = messages.find(
              (m: any) => m.role === "user"
            );
            if (firstUserMessage) {
              const title = await generateSessionTitle(firstUserMessage);
              await updateSessionTitle(session.id, title);
              console.log(`[chat] session title: "${title}"`);
            }
          }
        } catch (error) {
          console.error("[chat] onFinish error:", error);
        }
      },
      headers: {
        "X-Session-Id": session.id,
        "X-Project-Id": project.id,
        "X-DB-Type": project.dbType,
      },
    });
  } catch (error) {
    // Close connection on error path too
    if (dbConnection) await dbConnection.close();

    console.error("[chat] error:", error);
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
    select: { title: true },
  });

  console.log(`[chat GET] session=${sessionId}, messages=${messages.length}`);
  messages.forEach((m, i) => {
    const textParts = m.parts.filter((p: any) => p.type === "text");
    const toolParts = m.parts.filter((p: any) => p.type !== "text");
    console.log(`[chat GET]   msg[${i}] role=${m.role} textParts=${textParts.length} toolParts=${toolParts.length} partTypes=${m.parts.map((p: any) => p.type).join(",")}`);
  });

  return Response.json({
    messages,
    title: session?.title,
  });
}
