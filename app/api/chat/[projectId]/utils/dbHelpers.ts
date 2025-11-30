// lib/message-persistence.ts
import { prisma } from '@/lib/prisma';
import type { UIMessage } from 'ai';
import { Pool } from "pg";
import mysql from "mysql2/promise";
import { MongoClient } from "mongodb";

type DbType = "postgresql" | "mysql" | "mongodb";

// ============================================================================
// DATABASE QUERY EXECUTORS
// ============================================================================

// PostgreSQL Query Executor
async function executePostgresQuery(dbUrl: string, query: string) {
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
    console.error("PostgreSQL query error:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// MySQL Query Executor
async function executeMySQLQuery(dbUrl: string, query: string) {
  const connection = await mysql.createConnection(dbUrl);
  try {
    const [rows] = await connection.execute(query);
    return rows;
  } catch (error) {
    console.error("MySQL query error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// MongoDB Query Executor
async function executeMongoQuery(
  dbUrl: string,
  query: {
    collection: string;
    operation: string;
    filter?: any;
    options?: any;
    pipeline?: any[];
  }
) {
  const client = new MongoClient(dbUrl);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection(query.collection);

    switch (query.operation) {
      case "countDocuments":
        const count = await collection.countDocuments(query.filter || {});
        return { count };

      case "find":
        const cursor = collection.find(query.filter || {});
        if (query.options?.sort) cursor.sort(query.options.sort);
        if (query.options?.skip) cursor.skip(query.options.skip);
        if (query.options?.limit) cursor.limit(query.options.limit);
        return await cursor.toArray();

      case "aggregate":
        const aggCursor = collection.aggregate(query.pipeline || []);
        return await aggCursor.toArray();

      default:
        throw new Error(`Unsupported MongoDB operation: ${query.operation}`);
    }
  } catch (error) {
    console.error("MongoDB query error:", error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Universal database query executor
 * Automatically routes to the correct database driver based on dbType
 */
export async function executeDbQuery(
  dbUrl: string,
  query: string | object,
  dbType: DbType = "postgresql"
) {
  switch (dbType) {
    case "postgresql":
      return executePostgresQuery(dbUrl, query as string);

    case "mysql":
      return executeMySQLQuery(dbUrl, query as string);

    case "mongodb":
      return executeMongoQuery(dbUrl, query as any);

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

// ============================================================================
// DATABASE SCHEMA RETRIEVERS
// ============================================================================

// PostgreSQL Schema
async function getPostgresSchema(dbUrl: string, tableName?: string) {
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
      dbType: "postgresql",
      tables: Object.keys(tables),
      columns: tables,
      tableCount: Object.keys(tables).length,
    };
  } catch (error) {
    console.error("PostgreSQL schema retrieval error:", error);
    throw error;
  }
}

// MySQL Schema
async function getMySQLSchema(dbUrl: string, tableName?: string) {
  const connection = await mysql.createConnection(dbUrl);
  try {
    if (tableName) {
      const [columns] = await connection.execute(`DESCRIBE ${tableName}`) as [any[], any];
      return {
        dbType: "mysql",
        table: tableName,
        columns: columns,
      };
    } else {
      const [tables] = await connection.execute("SHOW TABLES") as [any[], any];
      const tableRows = tables as any[];
      const tableNames = tableRows.map((row: any) => Object.values(row)[0] as string);
      
      // Get column info for all tables
      const columns: Record<string, any[]> = {};
      for (const table of tableNames) {
        const [cols] = await connection.execute(`DESCRIBE ${table}`) as [any[], any];
        columns[table as string] = cols as any[];
      }

      return {
        dbType: "mysql",
        tables: tableNames,
        columns: columns,
        tableCount: tableNames.length,
      };
    }
  } catch (error) {
    console.error("MySQL schema retrieval error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// MongoDB Schema
async function getMongoSchema(dbUrl: string, collectionName?: string) {
  const client = new MongoClient(dbUrl);
  try {
    await client.connect();
    const db = client.db();

    if (collectionName) {
      const collection = db.collection(collectionName);
      
      // Get sample documents to infer schema
      const samples = await collection.find({}).limit(5).toArray();
      
      if (samples.length === 0) {
        return {
          dbType: "mongodb",
          collection: collectionName,
          schema: "Empty collection",
          documentCount: 0,
        };
      }

      // Infer schema from samples
      const fieldTypes: Record<string, Set<string>> = {};
      samples.forEach(doc => {
        Object.entries(doc).forEach(([key, value]) => {
          if (!fieldTypes[key]) {
            fieldTypes[key] = new Set();
          }
          const type = Array.isArray(value)
            ? "array"
            : value === null
            ? "null"
            : typeof value === "object"
            ? "object"
            : typeof value;
          fieldTypes[key].add(type);
        });
      });

      const schema = Object.entries(fieldTypes).map(([field, types]) => ({
        field,
        types: Array.from(types),
        example: samples[0][field],
      }));

      const count = await collection.countDocuments();

      return {
        dbType: "mongodb",
        collection: collectionName,
        schema,
        documentCount: count,
        samplesAnalyzed: samples.length,
        note: "Schema inferred from sample documents. MongoDB is schemaless.",
      };
    } else {
      // List all collections
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      // Get document counts for each collection
      const counts: Record<string, number> = {};
      for (const name of collectionNames) {
        counts[name] = await db.collection(name).countDocuments();
      }

      return {
        dbType: "mongodb",
        collections: collectionNames,
        documentCounts: counts,
        collectionCount: collectionNames.length,
      };
    }
  } catch (error) {
    console.error("MongoDB schema retrieval error:", error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Universal database schema getter
 * Automatically routes to the correct schema retriever based on dbType
 */
export async function getDbSchema(
  dbUrl: string,
  tableName?: string,
  dbType: DbType = "postgresql"
) {
  switch (dbType) {
    case "postgresql":
      return getPostgresSchema(dbUrl, tableName);

    case "mysql":
      return getMySQLSchema(dbUrl, tableName);

    case "mongodb":
      return getMongoSchema(dbUrl, tableName);

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

// ============================================================================
// MESSAGE PERSISTENCE (YOUR EXISTING CODE)
// ============================================================================

/**
 * Load all messages from a chat session in UIMessage format
 * UIMessage is the format used by useChat and recommended for persistence
 */
export async function loadMessages(sessionId: string): Promise<UIMessage[]> {
  const dbMessages = await prisma.message.findMany({
    where: { chatSessionId: sessionId },
    orderBy: { createdAt: 'asc' }
  });

  return dbMessages.map((msg: any) => convertDbMessageToUI(msg));
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

  const existingIds = new Set(existingMessages.map((m: any) => m.id));

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