import { z } from "zod";
import { executeDbQuery, getDbSchema } from "./dbHelpers";

const PAGINATION_CONFIG = {
  maxRowsPerPage: 50,
  maxRowsBeforeExport: 100,
  maxTokensForResults: 4000,
};

type DbType = "postgresql" | "mysql" | "mongodb";

// MongoDB-specific query builder
class MongoQueryBuilder {
  static buildCountQuery(collection: string, filter: object = {}) {
    return { collection, operation: "countDocuments", filter };
  }

  static buildFindQuery(
    collection: string,
    filter: object = {},
    options: { limit?: number; skip?: number; sort?: object } = {}
  ) {
    return { collection, operation: "find", filter, options };
  }

  static buildAggregateQuery(collection: string, pipeline: any[]) {
    return { collection, operation: "aggregate", pipeline };
  }
}

// SQL Query Validator
class SqlQueryValidator {
  static validate(query: string, dbType: "postgresql" | "mysql"): {
    isValid: boolean;
    error?: string;
  } {
    const normalized = query.trim().toLowerCase();

    if (!normalized.startsWith("select")) {
      return { isValid: false, error: "Only SELECT queries are allowed" };
    }

    if (!normalized.includes("limit")) {
      return {
        isValid: false,
        error: `Query must include LIMIT clause (max ${PAGINATION_CONFIG.maxRowsPerPage})`,
      };
    }

    return { isValid: true };
  }
}

export function createDatabaseTools(dbUrl: string, dbType: DbType) {
  // Common tools that work across all database types
  const commonTools = {
    getSchema: {
      description:
        "Get database schema information. Use this to understand table/collection structure before writing queries.",
      inputSchema: z.object({
        tableName: z
          .string()
          .optional()
          .describe(
            "Specific table/collection name, or empty for all tables/collections"
          ),
      }),
      execute: async ({ tableName }: { tableName?: string }) => {
        try {
          const schema = await getDbSchema(dbUrl, tableName, dbType);
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

    generateExcel: {
      description: `Generate Excel file from query results. Use this when:
- Row count > ${PAGINATION_CONFIG.maxRowsBeforeExport}
- User explicitly asks to download/export data
- Results are too large to display in chat`,
      inputSchema: z.object({
        query: z.string().describe("Query to export"),
        filename: z.string().describe("Excel filename"),
        sheetName: z.string().optional().describe("Sheet name"),
        message: z
          .string()
          .describe(
            "Message explaining what data will be exported and how many rows"
          ),
      }),
    },
  };

  // SQL-specific tools (PostgreSQL & MySQL)
  if (dbType === "postgresql" || dbType === "mysql") {
    return {
      ...commonTools,

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

            const results = await executeDbQuery(dbUrl, countQuery, dbType);
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

      executeQuery: {
        description: `Execute a SQL SELECT query with pagination. Always check row count first using getRowCount. 
Maximum ${PAGINATION_CONFIG.maxRowsPerPage} rows per query. Use LIMIT and OFFSET for pagination.`,
        inputSchema: z.object({
          query: z.string().describe("The SQL SELECT query with LIMIT clause"),
          explanation: z.string().describe("What this query does"),
          page: z
            .number()
            .optional()
            .describe("Page number (for offset pagination)"),
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
          estimatedRowCount?: number;
        }) => {
          try {
            const validation = SqlQueryValidator.validate(query, dbType);
            if (!validation.isValid) {
              return { error: validation.error, results: null };
            }

            const results = await executeDbQuery(dbUrl, query, dbType);
            const resultString = JSON.stringify(results);
            const estimatedTokens = Math.ceil(resultString.length / 4);

            return {
              explanation,
              results:
                estimatedTokens > PAGINATION_CONFIG.maxTokensForResults
                  ? results.slice(0, 20)
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
            const normalized = query.trim().toLowerCase();
            if (!normalized.startsWith("select")) {
              return { error: "Only SELECT queries allowed", results: null };
            }

            const results = await executeDbQuery(dbUrl, query, dbType);

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
    };
  }

  // MongoDB-specific tools
  if (dbType === "mongodb") {
    return {
      ...commonTools,

      getDocumentCount: {
        description:
          "Get the count of documents that would be returned by a query. Use this BEFORE executing any query to check dataset size.",
        inputSchema: z.object({
          collection: z.string().describe("Collection name"),
          filter: z
            .record(z.string(), z.any())
            .optional()
            .describe("MongoDB filter object (e.g., { status: 'active' })"),
          explanation: z.string().describe("Why you're checking the count"),
        }),
        execute: async ({
          collection,
          filter = {},
          explanation,
        }: {
          collection: string;
          filter?: Record<string, any>;
          explanation: string;
        }) => {
          try {
            const query = MongoQueryBuilder.buildCountQuery(collection, filter);
            const result = await executeDbQuery(dbUrl, query, dbType);
            const count = result.count || 0;

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

      findDocuments: {
        description: `Find documents in a MongoDB collection with pagination. Always check document count first using getDocumentCount.
Maximum ${PAGINATION_CONFIG.maxRowsPerPage} documents per query.`,
        inputSchema: z.object({
          collection: z.string().describe("Collection name"),
          filter: z
            .record(z.string(), z.any())
            .optional()
            .describe("MongoDB filter object"),
          sort: z
            .record(z.string(), z.number())
            .optional()
            .describe("Sort specification (e.g., { createdAt: -1 })"),
          limit: z
            .number()
            .max(PAGINATION_CONFIG.maxRowsPerPage)
            .optional()
            .describe(`Maximum ${PAGINATION_CONFIG.maxRowsPerPage} documents`),
          skip: z.number().optional().describe("Number of documents to skip"),
          explanation: z.string().describe("What this query does"),
          estimatedCount: z
            .number()
            .optional()
            .describe("Estimated total documents from getDocumentCount"),
        }),
        execute: async ({
          collection,
          filter = {},
          sort,
          limit = PAGINATION_CONFIG.maxRowsPerPage,
          skip = 0,
          explanation,
          estimatedCount,
        }: {
          collection: string;
          filter?: Record<string, any>;
          sort?: Record<string, number>;
          limit?: number;
          skip?: number;
          explanation: string;
          estimatedCount?: number;
        }) => {
          try {
            const query = MongoQueryBuilder.buildFindQuery(collection, filter, {
              limit,
              skip,
              sort,
            });

            const results = await executeDbQuery(dbUrl, query, dbType);
            const resultString = JSON.stringify(results);
            const estimatedTokens = Math.ceil(resultString.length / 4);

            return {
              explanation,
              results:
                estimatedTokens > PAGINATION_CONFIG.maxTokensForResults
                  ? results.slice(0, 20)
                  : results,
              documentCount: results.length,
              estimatedTokens,
              truncated:
                estimatedTokens > PAGINATION_CONFIG.maxTokensForResults,
              warning:
                estimatedTokens > PAGINATION_CONFIG.maxTokensForResults
                  ? "Results truncated due to size. Consider using aggregations or exporting to Excel."
                  : null,
              pagination: {
                currentPage: Math.floor(skip / limit) + 1,
                hasMore: estimatedCount
                  ? skip + limit < estimatedCount
                  : results.length === limit,
                totalEstimated: estimatedCount,
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

      executeAggregation: {
        description:
          "Execute MongoDB aggregation pipeline for statistical summaries, grouping, and complex queries. Use this instead of fetching all documents.",
        inputSchema: z.object({
          collection: z.string().describe("Collection name"),
          pipeline: z
            .array(z.any())
            .describe(
              "MongoDB aggregation pipeline (e.g., [{ $match: {...} }, { $group: {...} }])"
            ),
          explanation: z.string().describe("What insights this provides"),
        }),
        execute: async ({
          collection,
          pipeline,
          explanation,
        }: {
          collection: string;
          pipeline: any[];
          explanation: string;
        }) => {
          try {
            const query = MongoQueryBuilder.buildAggregateQuery(
              collection,
              pipeline
            );
            const results = await executeDbQuery(dbUrl, query, dbType);

            return {
              explanation,
              results,
              documentCount: results.length,
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
    };
  }

  return commonTools;
}

export function getSystemPrompt(dbSummary: string, dbType: DbType) {
  const basePrompt = `You are a helpful database assistant for a ${dbType.toUpperCase()} database with the following details:

Database Summary:
${dbSummary}

Your role:
1. Help users query and understand their database
2. Generate optimized queries that handle large datasets efficiently
3. Suggest pagination when dealing with large result sets
4. Recommend data exports to Excel for datasets over ${PAGINATION_CONFIG.maxRowsBeforeExport} rows
5. Provide statistical summaries instead of raw data when appropriate

IMPORTANT RULES:
- Always check row/document count before executing queries
- When users want "all data", first check the count and suggest export if > ${PAGINATION_CONFIG.maxRowsBeforeExport}
- Use aggregations when appropriate instead of raw data
- Always ask for confirmation before executing potentially heavy queries
- Only use read operations (SELECT/find queries)`;

  if (dbType === "postgresql" || dbType === "mysql") {
    return `${basePrompt}

SQL-SPECIFIC RULES:
- Always use LIMIT clause to prevent overwhelming queries (max ${PAGINATION_CONFIG.maxRowsPerPage} rows)
- For counting operations, use COUNT(*) queries
- Use aggregations (COUNT, AVG, SUM, MIN, MAX, GROUP BY) for summaries
- Pagination: Use LIMIT and OFFSET for page navigation
- Example: SELECT * FROM users WHERE active = true ORDER BY created_at DESC LIMIT 50 OFFSET 0`;
  }

  if (dbType === "mongodb") {
    return `${basePrompt}

MONGODB-SPECIFIC RULES:
- Use .countDocuments() to check collection size before queries
- Always specify limit (max ${PAGINATION_CONFIG.maxRowsPerPage} documents)
- Use aggregation pipelines for complex queries and summaries
- Pagination: Use skip and limit for page navigation
- Example filter: { status: 'active', createdAt: { $gte: new Date('2024-01-01') } }
- Example aggregation: [{ $match: {...} }, { $group: { _id: '$category', count: { $sum: 1 } } }]
- Use proper MongoDB operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, etc.`;
  }

  return basePrompt;
}

export { PAGINATION_CONFIG };