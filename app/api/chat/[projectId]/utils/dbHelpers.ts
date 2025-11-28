// lib/message-persistence.ts
import { prisma } from '@/lib/prisma';
import type { UIMessage } from 'ai';

// Helper function to execute database query with connection pooling
export async function executeDbQuery(dbUrl: string, query: string) {
  const { Client } = require("pg");
  const client = new Client({
    connectionString: dbUrl,
    statement_timeout: 30000,
  });

  try {
    await client.connect();
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Helper function to get database schema
export async function getDbSchema(dbUrl: string, tableName?: string) {
  const schemaQuery = tableName
    ? `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = $1
      ORDER BY table_name, ordinal_position
    `
    : `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
      LIMIT 100
    `;

  try {
    const { Client } = require("pg");
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    const result = tableName
      ? await client.query(schemaQuery, [tableName])
      : await client.query(schemaQuery);

    await client.end();

    // Group columns by table
    const tables: Record<string, any[]> = {};
    result.rows.forEach((row: any) => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        default: row.column_default,
      });
    });

    return {
      tables: Object.keys(tables),
      columns: tables,
      tableCount: Object.keys(tables).length,
    };
  } catch (error) {
    console.error("Schema retrieval error:", error);
    throw error;
  }
}

/**
 * Load all messages from a chat session in UIMessage format
 * UIMessage is the format used by useChat and recommended for persistence
 */
export async function loadMessages(sessionId: string): Promise<UIMessage[]> {
  const dbMessages = await prisma.message.findMany({
    where: { chatSessionId: sessionId },
    orderBy: { createdAt: 'asc' }
  });

  return dbMessages.map(msg => convertDbMessageToUI(msg));
}

/**
 * Save messages after AI streaming completes
 * Receives UIMessage[] from onFinish callback
 */
export async function saveMessages(
  sessionId: string, 
  messages: UIMessage[]
): Promise<void> {
  const existingMessages = await prisma.message.findMany({
    where: { chatSessionId: sessionId },
    select: { id: true }
  });

  const existingIds = new Set(existingMessages.map(m => m.id));

  const newMessages = messages.filter(msg => !existingIds.has(msg.id));

  if (newMessages.length === 0) {
    console.log("✅ No new messages to save");
    return;
  }

  const dbRecords = newMessages.map(msg => 
    convertUIMessageToDb(msg, sessionId)
  );

  await prisma.message.createMany({
    data: dbRecords,
    skipDuplicates: true 
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() }
  });

  console.log(`💾 Saved ${newMessages.length} new messages to session ${sessionId}`);
}


/**
 * Convert database message to UIMessage format
 * UIMessage is the format used by useChat and AI SDK UI
 */
function convertDbMessageToUI(dbMessage: any): UIMessage {
  // UIMessage structure based on AI SDK 5
  const uiMessage: UIMessage = {
    id: dbMessage.id,
    role: dbMessage.role as 'system' | 'user' | 'assistant',
    parts: dbMessage.parts || [],
    metadata: dbMessage.metadata || undefined
  };

  return uiMessage;
}

/**
 * Convert UIMessage to database format
 * Store the complete UIMessage structure as recommended
 */
function convertUIMessageToDb(message: UIMessage, sessionId: string) {
  return {
    id: message.id,
    chatSessionId: sessionId,
    role: message.role,
    // Store the complete parts array as JSON
    parts: message.parts as any,
    metadata: message.metadata ?? undefined,
    // Extract text content for search/display purposes
    content: extractTextContent(message.parts),
    createdAt: new Date()
  };
}

/**
 * Extract plain text from UIMessage parts for search/display
 */
export function extractTextContent(parts: UIMessage['parts']): string {
  const textParts = parts.filter(p => p.type === 'text');
  return textParts.map((p: any) => p.text).join('\n');
}

/**
 * Get or create a chat session for a project
 */
export async function getOrCreateSession(
  userId: string,
  projectId: string,
  sessionId?: string
) {
  // If sessionId provided, try to load it
  if (sessionId) {
    const existing = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        projectId: projectId,
        userId: userId
      }
    });

    if (existing) return existing;
  }

  // Create new session
  return await prisma.chatSession.create({
    data: {
      projectId,
      userId,
      title: 'New Chat'
    }
  });
}

/**
 * List all chat sessions for a project
 */
export async function listSessions(projectId: string, userId: string) {
  return await prisma.chatSession.findMany({
    where: {
      projectId,
      userId
    },
    orderBy: {
      updatedAt: 'desc'
    },
    include: {
      _count: {
        select: { messages: true }
      }
    }
  });
}

/**
 * Update session title (can be auto-generated from first message)
 */
export async function updateSessionTitle(sessionId: string, title: string) {
  return await prisma.chatSession.update({
    where: { id: sessionId },
    data: { 
      title,
      updatedAt: new Date()
    }
  });
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteSession(sessionId: string, userId: string) {
  // Verify ownership before deleting
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId
    }
  });

  if (!session) {
    throw new Error('Session not found or unauthorized');
  }

  return await prisma.chatSession.delete({
    where: { id: sessionId }
  });
}