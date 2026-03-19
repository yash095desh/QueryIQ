import { Client as PgClient } from 'pg';
import mysql, { Connection as MySQLConnection, RowDataPacket } from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

// ===========================
// Type Definitions
// ===========================

export interface TableColumn {
  name: string;
  type: string;
}

export interface TableSummary {
  table: string;
  columns: TableColumn[];
}

export interface CollectionSummary {
  collection: string;
  documentCount: number;
  sampleFields?: { name: string; type: string }[];
}

export type DbSummary = TableSummary[] | CollectionSummary[];

export enum DatabaseType {
  POSTGRES = 'postgres',
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
}

// ===========================
// Custom Error Classes
// ===========================

export class DatabaseConnectionError extends Error {
  constructor(dbType: string, originalError: Error) {
    super(`Failed to connect to ${dbType} database: ${originalError.message}`);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseIntrospectionError extends Error {
  constructor(dbType: string, originalError: Error) {
    super(`Failed to introspect ${dbType} database: ${originalError.message}`);
    this.name = 'DatabaseIntrospectionError';
  }
}

export class UnsupportedDatabaseError extends Error {
  constructor(dbType: string) {
    super(`Unsupported database type: ${dbType}. Supported types: ${Object.values(DatabaseType).join(', ')}`);
    this.name = 'UnsupportedDatabaseError';
  }
}

// ===========================
// PostgreSQL Introspection (single query, no N+1)
// ===========================

async function introspectPostgres(connectionString: string): Promise<TableSummary[]> {
  const client = new PgClient({
    connectionString,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
  });

  try {
    await client.connect();

    // Single query to get ALL tables and columns at once
    const result = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    // Group columns by table in JS
    const tables = new Map<string, TableColumn[]>();
    for (const row of result.rows) {
      if (!tables.has(row.table_name)) {
        tables.set(row.table_name, []);
      }
      tables.get(row.table_name)!.push({
        name: row.column_name,
        type: row.data_type,
      });
    }

    return Array.from(tables.entries()).map(([table, columns]) => ({
      table,
      columns,
    }));
  } catch (error) {
    if (error instanceof DatabaseIntrospectionError) throw error;
    throw new DatabaseConnectionError('PostgreSQL', error as Error);
  } finally {
    await safeClose(client.end.bind(client), 'PostgreSQL client');
  }
}

// ===========================
// MySQL Introspection (single query, no N+1)
// ===========================

async function introspectMySQL(connectionString: string): Promise<TableSummary[]> {
  let connection: MySQLConnection | null = null;

  try {
    connection = await mysql.createConnection({
      uri: connectionString,
      connectTimeout: 10000,
    });

    // Single query to get ALL tables and columns at once
    const [rows] = await connection.query<RowDataPacket[]>(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);

    // Group columns by table in JS
    const tables = new Map<string, TableColumn[]>();
    for (const row of rows) {
      const tableName = row.TABLE_NAME as string;
      if (!tables.has(tableName)) {
        tables.set(tableName, []);
      }
      tables.get(tableName)!.push({
        name: row.COLUMN_NAME as string,
        type: row.DATA_TYPE as string,
      });
    }

    return Array.from(tables.entries()).map(([table, columns]) => ({
      table,
      columns,
    }));
  } catch (error) {
    if (error instanceof DatabaseIntrospectionError) throw error;
    throw new DatabaseConnectionError('MySQL', error as Error);
  } finally {
    if (connection) {
      await safeClose(connection.end.bind(connection), 'MySQL connection');
    }
  }
}

// ===========================
// MongoDB Introspection (uses MongoClient directly, not mongoose singleton)
// ===========================

async function introspectMongo(connectionString: string): Promise<CollectionSummary[]> {
  const client = new MongoClient(connectionString, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    await client.connect();
    const db = client.db();

    const collections = await db.listCollections().toArray();
    const summary: CollectionSummary[] = [];

    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const count = await coll.countDocuments({}, { maxTimeMS: 5000 });

      // Sample one document to infer field types
      const sample = await coll.findOne();
      const sampleFields = sample
        ? Object.entries(sample).map(([key, value]) => ({
            name: key,
            type: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value,
          }))
        : undefined;

      summary.push({
        collection: collection.name,
        documentCount: count,
        sampleFields,
      });
    }

    return summary.sort((a, b) => a.collection.localeCompare(b.collection));
  } catch (error) {
    if (error instanceof DatabaseIntrospectionError) throw error;
    throw new DatabaseConnectionError('MongoDB', error as Error);
  } finally {
    await safeClose(client.close.bind(client), 'MongoDB connection');
  }
}

// ===========================
// Utility Functions
// ===========================

async function safeClose(closeFn: () => Promise<unknown>, resourceName: string): Promise<void> {
  try {
    await closeFn();
  } catch (error) {
    console.warn(`Failed to close ${resourceName}:`, (error as Error).message);
  }
}

function normalizeDatabaseType(dbType: string): DatabaseType {
  const normalized = dbType.toLowerCase().trim();

  if (Object.values(DatabaseType).includes(normalized as DatabaseType)) {
    return normalized as DatabaseType;
  }

  throw new UnsupportedDatabaseError(dbType);
}

/**
 * Generate a hash of table/collection names for quick schema drift detection.
 */
export function generateSchemaHash(summary: DbSummary): string {
  const names = summary.map((item: any) => item.table || item.collection).sort();
  return crypto.createHash('sha256').update(JSON.stringify(names)).digest('hex').slice(0, 16);
}

// ===========================
// Public API
// ===========================

export async function introspectDatabase(
  connectionString: string,
  dbType: string
): Promise<DbSummary> {
  const normalizedType = normalizeDatabaseType(dbType);

  switch (normalizedType) {
    case DatabaseType.POSTGRES:
    case DatabaseType.POSTGRESQL:
      return introspectPostgres(connectionString);

    case DatabaseType.MYSQL:
      return introspectMySQL(connectionString);

    case DatabaseType.MONGODB:
      return introspectMongo(connectionString);

    default:
      throw new UnsupportedDatabaseError(dbType);
  }
}
