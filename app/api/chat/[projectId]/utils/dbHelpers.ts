import { prisma } from '@/lib/prisma';
import type { UIMessage } from 'ai';
import { Client as PgClient } from 'pg';
import mysql, { Connection as MySQLConnection } from 'mysql2/promise';
import { MongoClient, Db as MongoDb } from 'mongodb';

type DbType = "postgresql" | "mysql" | "mongodb";

// ============================================================================
// DATABASE CONNECTION - Shared per request, reused across tool calls
// ============================================================================

export interface DbConnection {
  query: (query: string | object) => Promise<any>;
  getSchema: (tableName?: string) => Promise<any>;
  close: () => Promise<void>;
  dbType: DbType;
}

/**
 * Create a database connection that lives for the duration of a request.
 * All tool calls within a single chat request share this connection.
 */
export async function createDbConnection(dbUrl: string, dbType: DbType): Promise<DbConnection> {
  switch (dbType) {
    case "postgresql":
      return createPostgresConnection(dbUrl);
    case "mysql":
      return createMySQLConnection(dbUrl);
    case "mongodb":
      return createMongoConnection(dbUrl);
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

// --- PostgreSQL ---

async function createPostgresConnection(dbUrl: string): Promise<DbConnection> {
  const client = new PgClient({
    connectionString: dbUrl,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  return {
    dbType: "postgresql",
    async query(query: string | object) {
      const queryStr = typeof query === 'string' ? query.slice(0, 80) : JSON.stringify(query).slice(0, 80);
      console.log(`[pg] query: ${queryStr}...`);
      const result = await client.query(query as string);
      console.log(`[pg] returned ${result.rows.length} rows`);
      return result.rows;
    },
    async getSchema(tableName?: string) {
      const schemaQuery = tableName
        ? {
            text: `SELECT table_name, column_name, data_type, is_nullable, column_default
                   FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = $1
                   ORDER BY table_name, ordinal_position`,
            values: [tableName],
          }
        : `SELECT table_name, column_name, data_type, is_nullable, column_default
           FROM information_schema.columns
           WHERE table_schema = 'public'
           ORDER BY table_name, ordinal_position`;

      const result = await client.query(schemaQuery);

      const tables: Record<string, any[]> = {};
      for (const row of result.rows) {
        if (!tables[row.table_name]) tables[row.table_name] = [];
        tables[row.table_name].push({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === "YES",
          default: row.column_default,
        });
      }

      return {
        dbType: "postgresql",
        tables: Object.keys(tables),
        columns: tables,
        tableCount: Object.keys(tables).length,
      };
    },
    async close() {
      try { await client.end(); } catch (e) { /* ignore close errors */ }
    },
  };
}

// --- MySQL ---

async function createMySQLConnection(dbUrl: string): Promise<DbConnection> {
  const connection = await mysql.createConnection({
    uri: dbUrl,
    connectTimeout: 10000,
  });

  return {
    dbType: "mysql",
    async query(query: string | object) {
      console.log(`[mysql] query: ${(query as string).slice(0, 80)}...`);
      const [rows] = await connection.execute(query as string);
      console.log(`[mysql] returned ${(rows as any[]).length} rows`);
      return rows;
    },
    async getSchema(tableName?: string) {
      if (tableName) {
        // Use INFORMATION_SCHEMA instead of DESCRIBE to avoid SQL injection
        const [columns] = await connection.execute(
          `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
           ORDER BY ORDINAL_POSITION`,
          [tableName]
        ) as [any[], any];
        return {
          dbType: "mysql",
          table: tableName,
          columns: (columns as any[]).map(c => ({
            name: c.COLUMN_NAME,
            type: c.DATA_TYPE,
            nullable: c.IS_NULLABLE === "YES",
            default: c.COLUMN_DEFAULT,
          })),
        };
      }

      const [rows] = await connection.execute(
        `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         ORDER BY TABLE_NAME, ORDINAL_POSITION`
      ) as [any[], any];

      const tables: Record<string, any[]> = {};
      for (const row of rows as any[]) {
        const tn = row.TABLE_NAME as string;
        if (!tables[tn]) tables[tn] = [];
        tables[tn].push({
          name: row.COLUMN_NAME,
          type: row.DATA_TYPE,
          nullable: row.IS_NULLABLE === "YES",
          default: row.COLUMN_DEFAULT,
        });
      }

      return {
        dbType: "mysql",
        tables: Object.keys(tables),
        columns: tables,
        tableCount: Object.keys(tables).length,
      };
    },
    async close() {
      try { await connection.end(); } catch (e) { /* ignore close errors */ }
    },
  };
}

// --- MongoDB ---

async function createMongoConnection(dbUrl: string): Promise<DbConnection> {
  const client = new MongoClient(dbUrl, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  const db = client.db();

  return {
    dbType: "mongodb",
    async query(query: string | object) {
      const q = query as {
        collection: string;
        operation: string;
        filter?: any;
        options?: any;
        pipeline?: any[];
      };
      console.log(`[mongo] ${q.operation} on ${q.collection}`);

      const collection = db.collection(q.collection);

      switch (q.operation) {
        case "countDocuments":
          return { count: await collection.countDocuments(q.filter || {}) };
        case "find": {
          const cursor = collection.find(q.filter || {});
          if (q.options?.sort) cursor.sort(q.options.sort);
          if (q.options?.skip) cursor.skip(q.options.skip);
          if (q.options?.limit) cursor.limit(q.options.limit);
          return await cursor.toArray();
        }
        case "aggregate":
          return await collection.aggregate(q.pipeline || []).toArray();
        default:
          throw new Error(`Unsupported MongoDB operation: ${q.operation}`);
      }
    },
    async getSchema(collectionName?: string) {
      if (collectionName) {
        const collection = db.collection(collectionName);
        const samples = await collection.find({}).limit(5).toArray();

        if (samples.length === 0) {
          return { dbType: "mongodb", collection: collectionName, schema: "Empty collection", documentCount: 0 };
        }

        const fieldTypes: Record<string, Set<string>> = {};
        for (const doc of samples) {
          for (const [key, value] of Object.entries(doc)) {
            if (!fieldTypes[key]) fieldTypes[key] = new Set();
            fieldTypes[key].add(Array.isArray(value) ? "array" : value === null ? "null" : typeof value === "object" ? "object" : typeof value);
          }
        }

        return {
          dbType: "mongodb",
          collection: collectionName,
          schema: Object.entries(fieldTypes).map(([field, types]) => ({
            field, types: Array.from(types), example: samples[0][field],
          })),
          documentCount: await collection.countDocuments(),
          samplesAnalyzed: samples.length,
        };
      }

      const collections = await db.listCollections().toArray();
      const counts: Record<string, number> = {};
      for (const c of collections) {
        counts[c.name] = await db.collection(c.name).countDocuments();
      }
      return {
        dbType: "mongodb",
        collections: collections.map(c => c.name),
        documentCounts: counts,
        collectionCount: collections.length,
      };
    },
    async close() {
      try { await client.close(); } catch (e) { /* ignore close errors */ }
    },
  };
}

// ============================================================================
// MESSAGE PERSISTENCE
// ============================================================================

export async function loadMessages(sessionId: string): Promise<UIMessage[]> {
  const dbMessages = await prisma.message.findMany({
    where: { chatSessionId: sessionId },
    orderBy: { createdAt: 'asc' }
  });

  return dbMessages.map((msg: any) => ({
    id: msg.id,
    role: msg.role as 'system' | 'user' | 'assistant',
    parts: Array.isArray(msg.parts) ? msg.parts : [],
    ...(msg.metadata ? { metadata: msg.metadata } : {}),
  }));
}

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
  const updatedMessages = messages.filter(msg => existingIds.has(msg.id));

  // Insert new messages
  if (newMessages.length > 0) {
    const dbRecords = newMessages.map(msg => ({
      id: msg.id,
      chatSessionId: sessionId,
      role: msg.role,
      parts: msg.parts as any,
      metadata: msg.metadata ?? undefined,
      content: extractTextContent(msg.parts),
      createdAt: new Date(),
    }));

    await prisma.message.createMany({
      data: dbRecords,
      skipDuplicates: true
    });
  }

  // Update existing messages whose parts may have changed (e.g. tool call → text continuation)
  for (const msg of updatedMessages) {
    await prisma.message.update({
      where: { id: msg.id },
      data: {
        parts: msg.parts as any,
        content: extractTextContent(msg.parts),
        metadata: msg.metadata ?? undefined,
      },
    });
  }

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() }
  });
}

export function extractTextContent(parts: UIMessage['parts']): string {
  return parts.filter(p => p.type === 'text').map((p: any) => p.text).join('\n');
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function getOrCreateSession(
  userId: string,
  projectId: string,
  sessionId?: string
) {
  if (sessionId) {
    const existing = await prisma.chatSession.findFirst({
      where: { id: sessionId, projectId, userId }
    });
    if (existing) return existing;
  }

  return await prisma.chatSession.create({
    data: { projectId, userId, title: 'New Chat' }
  });
}

export async function listSessions(projectId: string, userId: string) {
  return await prisma.chatSession.findMany({
    where: { projectId, userId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { messages: true } } }
  });
}

export async function updateSessionTitle(sessionId: string, title: string) {
  return await prisma.chatSession.update({
    where: { id: sessionId },
    data: { title, updatedAt: new Date() }
  });
}

export async function deleteSession(sessionId: string, userId: string) {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId }
  });

  if (!session) throw new Error('Session not found or unauthorized');

  return await prisma.chatSession.delete({ where: { id: sessionId } });
}
