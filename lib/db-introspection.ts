import { Client as PgClient, QueryResult } from 'pg';
import mysql, { Connection as MySQLConnection, RowDataPacket } from 'mysql2/promise';
import mongoose, { Connection as MongooseConnection } from 'mongoose';

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
  storageSize: number;
}

export type DbSummary = TableSummary[] | CollectionSummary[];

export enum DatabaseType {
  POSTGRES = 'postgres',
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
}

interface PostgresTableRow {
  table_name: string;
}

interface PostgresColumnRow {
  column_name: string;
  data_type: string;
}

interface MongoCollStats {
  count: number;
  size?: number;
  storageSize?: number;
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
// PostgreSQL Introspection
// ===========================

async function introspectPostgres(connectionString: string): Promise<TableSummary[]> {
  const client = new PgClient({ connectionString });

  try {
    await client.connect();

    const tables = await fetchPostgresTables(client);
    const summary: TableSummary[] = [];

    for (const tableName of tables) {
      const columns = await fetchPostgresColumns(client, tableName);
      summary.push({
        table: tableName,
        columns,
      });
    }

    return summary;
  } catch (error) {
    if (error instanceof DatabaseIntrospectionError) {
      throw error;
    }
    throw new DatabaseConnectionError('PostgreSQL', error as Error);
  } finally {
    await safeClose(client.end.bind(client), 'PostgreSQL client');
  }
}

async function fetchPostgresTables(client: PgClient): Promise<string[]> {
  try {
    const result: QueryResult<PostgresTableRow> = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    return result.rows.map((row) => row.table_name);
  } catch (error) {
    throw new DatabaseIntrospectionError('PostgreSQL', error as Error);
  }
}

async function fetchPostgresColumns(client: PgClient, tableName: string): Promise<TableColumn[]> {
  try {
    const result: QueryResult<PostgresColumnRow> = await client.query(
      `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `,
      [tableName]
    );

    return result.rows.map((col) => ({
      name: col.column_name,
      type: col.data_type,
    }));
  } catch (error) {
    throw new DatabaseIntrospectionError('PostgreSQL', error as Error);
  }
}

// ===========================
// MySQL Introspection
// ===========================

async function introspectMySQL(connectionString: string): Promise<TableSummary[]> {
  let connection: MySQLConnection | null = null;

  try {
    connection = await mysql.createConnection(connectionString);

    const tables = await fetchMySQLTables(connection);
    const summary: TableSummary[] = [];

    for (const tableName of tables) {
      const columns = await fetchMySQLColumns(connection, tableName);
      summary.push({
        table: tableName,
        columns,
      });
    }

    return summary;
  } catch (error) {
    if (error instanceof DatabaseIntrospectionError) {
      throw error;
    }
    throw new DatabaseConnectionError('MySQL', error as Error);
  } finally {
    if (connection) {
      await safeClose(connection.end.bind(connection), 'MySQL connection');
    }
  }
}

async function fetchMySQLTables(connection: MySQLConnection): Promise<string[]> {
  try {
    const [rows] = await connection.query<RowDataPacket[]>('SHOW TABLES;');
    return rows.map((row) => Object.values(row)[0] as string).sort();
  } catch (error) {
    throw new DatabaseIntrospectionError('MySQL', error as Error);
  }
}

async function fetchMySQLColumns(connection: MySQLConnection, tableName: string): Promise<TableColumn[]> {
  try {
    const [rows] = await connection.query<RowDataPacket[]>(`SHOW COLUMNS FROM \`${tableName}\`;`);
    return rows.map((col) => ({
      name: col.Field as string,
      type: col.Type as string,
    }));
  } catch (error) {
    throw new DatabaseIntrospectionError('MySQL', error as Error);
  }
}

// ===========================
// MongoDB Introspection
// ===========================

async function introspectMongo(connectionString: string): Promise<CollectionSummary[]> {
  try {
    const dbName = extractMongoDbName(connectionString);
    await mongoose.connect(connectionString, { dbName });

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Failed to obtain MongoDB database instance');
    }

    const collections = await db.listCollections().toArray();
    const summary: CollectionSummary[] = [];

    for (const collection of collections) {
      const stats = await fetchMongoCollectionStats(db, collection.name);
      summary.push(stats);
    }

    return summary.sort((a, b) => a.collection.localeCompare(b.collection));
  } catch (error) {
    if (error instanceof DatabaseIntrospectionError) {
      throw error;
    }
    throw new DatabaseConnectionError('MongoDB', error as Error);
  } finally {
    await safeClose(mongoose.disconnect.bind(mongoose), 'MongoDB connection');
  }
}

async function fetchMongoCollectionStats(db: any, collectionName: string): Promise<CollectionSummary> {
  try {
    const stats = (await db.command({ collStats: collectionName })) as MongoCollStats;
    return {
      collection: collectionName,
      documentCount: stats.count || 0,
      storageSize: stats.size || stats.storageSize || 0,
    };
  } catch (error) {
    throw new DatabaseIntrospectionError('MongoDB', error as Error);
  }
}

function extractMongoDbName(connectionString: string): string | undefined {
  const match = connectionString.match(/\/([^/?]+)(\?|$)/);
  return match?.[1];
}

// ===========================
// Utility Functions
// ===========================

async function safeClose(closeFn: () => Promise<unknown>, resourceName: string): Promise<void> {
  try {
    await closeFn();
  } catch (error) {
    console.warn(`⚠️ Failed to close ${resourceName}:`, (error as Error).message);
  }
}

function normalizeDatabaseType(dbType: string): DatabaseType {
  const normalized = dbType.toLowerCase().trim();
  
  if (Object.values(DatabaseType).includes(normalized as DatabaseType)) {
    return normalized as DatabaseType;
  }
  
  throw new UnsupportedDatabaseError(dbType);
}

// ===========================
// Public API
// ===========================

/**
 * Introspects a database and returns its schema summary.
 * 
 * @param connectionString - The database connection string
 * @param dbType - The type of database (postgres, mysql, mongodb)
 * @returns A summary of the database schema
 * @throws {UnsupportedDatabaseError} If the database type is not supported
 * @throws {DatabaseConnectionError} If connection to the database fails
 * @throws {DatabaseIntrospectionError} If introspection fails
 * 
 * @example
 * ```typescript
 * const summary = await introspectDatabase(
 *   'postgresql://user:pass@localhost:5432/mydb',
 *   'postgres'
 * );
 * ```
 */

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
      // This should never happen due to normalizeDatabaseType, but satisfies TypeScript
      throw new UnsupportedDatabaseError(dbType);
  }
}