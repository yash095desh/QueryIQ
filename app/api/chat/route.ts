import { decrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { z } from "zod";

export const maxDuration = 30;


const PAGINATION_CONFIG = {
  maxRowsPerPage: 50,
  maxRowsBeforeExport: 100,
  maxTokensForResults: 4000, 
};

export async function POST(req: Request) {
  const { messages, projectId }: { messages: UIMessage[]; projectId: string } =
    await req.json();
  
  console?.log(messages,projectId)

  const project = await getProjectDetails(projectId);

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const dbUrl = await decrypt(project?.encryptedDbUrl);

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are a helpful database assistant for a project with the following details:

    Database Summary:
    ${project.dbSummary}

    Your role:
    1. Help users query and understand their database
    2. Generate optimized SQL queries that handle large datasets efficiently
    3. Suggest pagination when dealing with large result sets
    4. Recommend data exports to Excel for datasets over ${PAGINATION_CONFIG.maxRowsBeforeExport} rows
    5. Provide statistical summaries instead of raw data when appropriate

    IMPORTANT RULES:
    - Always use LIMIT clause to prevent overwhelming queries (max ${PAGINATION_CONFIG.maxRowsPerPage} rows)
    - For counting operations, use COUNT(*) queries instead of fetching all rows
    - When users want "all data", first check the count and suggest export if > ${PAGINATION_CONFIG.maxRowsBeforeExport} rows
    - Use aggregations (COUNT, AVG, SUM, MIN, MAX) when appropriate instead of raw data
    - Always ask for confirmation before executing potentially heavy queries
    - Only use SELECT queries (read-only)

    PAGINATION STRATEGY:
    When dealing with large datasets:
    1. First, get a count: SELECT COUNT(*) FROM table WHERE conditions
    2. If count > ${PAGINATION_CONFIG.maxRowsBeforeExport}, suggest export or pagination
    3. Use cursor-based pagination with primary key: WHERE id > last_id ORDER BY id LIMIT ${PAGINATION_CONFIG.maxRowsPerPage}
    4. Provide summaries and statistics instead of raw data when possible`,

    messages: convertToModelMessages(messages),

    tools: {
      // Get row count before executing query
      getRowCount: {
        description:
          "Get the count of rows that would be returned by a query. Use this BEFORE executing any query to check dataset size.",
        inputSchema: z.object({
          countQuery: z
            .string()
            .describe(
              "SQL COUNT query (e.g., SELECT COUNT(*) FROM table WHERE conditions)"
            ),
          explanation: z.string().describe("Why you're checking the count"),
        }),
        execute: async ({
          countQuery,
          explanation,
        }: {
          countQuery: string;
          explanation: string;
        }) => {
          try {
            if (!countQuery.trim().toLowerCase().includes("count(")) {
              return {
                error: "Query must be a COUNT query",
                count: null,
              };
            }

            const results = await executeDbQuery(dbUrl, countQuery);
            const count = results[0]?.count || results[0]?.["COUNT(*)"] || 0;

            return {
              explanation,
              count: Number(count),
              shouldPaginate: count > PAGINATION_CONFIG.maxRowsPerPage,
              shouldExport: count > PAGINATION_CONFIG.maxRowsBeforeExport,
              recommendation:
                count > PAGINATION_CONFIG.maxRowsBeforeExport
                  ? "Dataset is large. Recommend exporting to Excel instead of displaying inline."
                  : count > PAGINATION_CONFIG.maxRowsPerPage
                  ? "Dataset is medium-sized. Use pagination to display results."
                  : "Dataset is small enough to display directly.",
            };
          } catch (error) {
            return {
              error:
                error instanceof Error ? error.message : "Count query failed",
              count: null,
            };
          }
        },
      },

      // Execute paginated query
      executeQuery: {
        description: `Execute a SQL SELECT query with pagination. Always check row count first using getRowCount. 
Maximum ${PAGINATION_CONFIG.maxRowsPerPage} rows per query. Use cursor-based pagination for better performance.`,
        inputSchema: z.object({
          query: z.string().describe("The SQL SELECT query with LIMIT clause"),
          explanation: z.string().describe("What this query does"),
          page: z
            .number()
            .optional()
            .describe("Page number (for offset pagination)"),
          lastId: z
            .any()
            .optional()
            .describe("Last ID from previous page (for cursor pagination)"),
          estimatedRowCount: z
            .number()
            .optional()
            .describe("Estimated total rows from getRowCount"),
        }),
        execute: async ({
          query,
          explanation,
          page = 1,
          estimatedRowCount,
        }: {
          query: string;
          explanation: string;
          page?: number;
          lastId?: any;
          estimatedRowCount?: number;
        }) => {
          try {
            // Validate it's a SELECT query
            const normalizedQuery = query.trim().toLowerCase();
            if (!normalizedQuery.startsWith("select")) {
              return {
                error: "Only SELECT queries are allowed",
                results: null,
              };
            }

            // Enforce LIMIT clause
            if (!normalizedQuery.includes("limit")) {
              return {
                error: `Query must include LIMIT clause (max ${PAGINATION_CONFIG.maxRowsPerPage})`,
                results: null,
              };
            }

            // Execute query
            const results = await executeDbQuery(dbUrl, query);

            // Calculate token estimate (rough approximation)
            const resultString = JSON.stringify(results);
            const estimatedTokens = Math.ceil(resultString.length / 4);

            return {
              explanation,
              results:
                estimatedTokens > PAGINATION_CONFIG.maxTokensForResults
                  ? results.slice(0, 20) // Return only first 20 rows if too large
                  : results,
              rowCount: results.length,
              estimatedTokens,
              truncated:
                estimatedTokens > PAGINATION_CONFIG.maxTokensForResults,
              warning:
                estimatedTokens > PAGINATION_CONFIG.maxTokensForResults
                  ? "Results truncated due to size. Consider using aggregations or exporting to Excel."
                  : null,
              pagination: {
                currentPage: page,
                hasMore: estimatedRowCount
                  ? page * PAGINATION_CONFIG.maxRowsPerPage < estimatedRowCount
                  : results.length === PAGINATION_CONFIG.maxRowsPerPage,
                totalEstimated: estimatedRowCount,
              },
            };
          } catch (error) {
            return {
              error:
                error instanceof Error
                  ? error.message
                  : "Query execution failed",
              results: null,
            };
          }
        },
      },

      // Execute aggregation query for summaries
      executeAggregation: {
        description:
          "Execute aggregation queries (COUNT, AVG, SUM, MIN, MAX, GROUP BY) for statistical summaries. Use this instead of fetching all rows.",
        inputSchema: z.object({
          query: z.string().describe("SQL aggregation query"),
          explanation: z.string().describe("What insights this provides"),
        }),
        execute: async ({
          query,
          explanation,
        }: {
          query: string;
          explanation: string;
        }) => {
          try {
            const normalizedQuery = query.trim().toLowerCase();
            if (!normalizedQuery.startsWith("select")) {
              return { error: "Only SELECT queries allowed", results: null };
            }

            const results = await executeDbQuery(dbUrl, query);

            return {
              explanation,
              results,
              rowCount: results.length,
              type: "aggregation",
            };
          } catch (error) {
            return {
              error:
                error instanceof Error ? error.message : "Aggregation failed",
              results: null,
            };
          }
        },
      },

      // Get database schema
      getSchema: {
        description:
          "Get database schema information. Use this to understand table structure before writing queries.",
        inputSchema: z.object({
          tableName: z
            .string()
            .optional()
            .describe("Specific table name, or empty for all tables"),
        }),
        execute: async ({ tableName }: { tableName?: string }) => {
          try {
            const schema = await getDbSchema(dbUrl, tableName);
            return schema;
          } catch (error) {
            return {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to retrieve schema",
            };
          }
        },
      },

      // Ask for confirmation before heavy operations
      askForConfirmation: {
        description:
          "Ask user for confirmation before executing queries that will return many rows or might be slow. Use when estimated row count > 100.",
        inputSchema: z.object({
          message: z.string().describe("Confirmation message"),
          queryPreview: z.string().describe("Query to be executed"),
          estimatedRows: z.number().describe("Estimated number of rows"),
          alternatives: z
            .array(z.string())
            .optional()
            .describe("Alternative approaches (e.g., export, aggregation)"),
        }),
      },

      // Generate Excel export (client-side tool)
      generateExcel: {
        description: `Generate Excel file from query results. Use this when:
- Row count > ${PAGINATION_CONFIG.maxRowsBeforeExport}
- User explicitly asks to download/export data
- Results are too large to display in chat`,
        inputSchema: z.object({
          query: z.string().describe("SQL query to export"),
          filename: z.string().describe("Excel filename"),
          sheetName: z.string().optional().describe("Sheet name"),
          message: z
            .string()
            .describe(
              "Message explaining what data will be exported and how many rows"
            ),
        }),
      },
    },
  });

  return result.toUIMessageStreamResponse();
}

// Helper function to get project details
async function getProjectDetails(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        encryptedDbUrl: true,
        dbType: true,
        dbSummary: true,
      },
    });

    if (!project) {
      return null;
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description ?? "",
      encryptedDbUrl: project.encryptedDbUrl,
      dbType: project.dbType,
      dbSummary: project.dbSummary ?? "No summary available",
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw new Error("Failed to fetch project details");
  }
}

// Helper function to execute database query with connection pooling
async function executeDbQuery(dbUrl: string, query: string) {

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

  // For MySQL:
  // const mysql = require('mysql2/promise');
  // const connection = await mysql.createConnection(dbUrl);
  // const [rows] = await connection.execute(query);
  // await connection.end();
  // return rows;
}

// Helper function to get database schema
async function getDbSchema(dbUrl: string, tableName?: string) {
  // PostgreSQL schema query
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
