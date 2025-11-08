// app/api/execute-export/route.ts

import { decrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // Longer timeout for exports

export async function POST(req: Request) {
  try {
    const { projectId, query } = await req.json();

    if (!projectId || !query) {
      return Response.json(
        { error: "Missing projectId or query" },
        { status: 400 }
      );
    }

    // Fetch project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        encryptedDbUrl: true,
        dbType: true,
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const dbUrl = await decrypt(project.encryptedDbUrl);

    // Validate it's a SELECT query
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery.startsWith("select")) {
      return Response.json(
        { error: "Only SELECT queries are allowed" },
        { status: 400 }
      );
    }

    // Execute query with higher limit for exports
    // But still cap at a reasonable number to prevent memory issues
    const MAX_EXPORT_ROWS = 50000;
    
    let finalQuery = query;
    
    // If query doesn't have LIMIT, add one
    if (!normalizedQuery.includes("limit")) {
      finalQuery = `${query} LIMIT ${MAX_EXPORT_ROWS}`;
    } else {
      // Extract existing LIMIT and cap it if necessary
      const limitMatch = normalizedQuery.match(/limit\s+(\d+)/);
      if (limitMatch) {
        const requestedLimit = parseInt(limitMatch[1], 10);
        if (requestedLimit > MAX_EXPORT_ROWS) {
          finalQuery = query.replace(
            /limit\s+\d+/i,
            `LIMIT ${MAX_EXPORT_ROWS}`
          );
        }
      }
    }

    // Execute the query
    const data = await executeDbQuery(dbUrl, finalQuery);

    return Response.json({
      data,
      rowCount: data.length,
      capped: data.length === MAX_EXPORT_ROWS,
    });
  } catch (error) {
    console.error("Export error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Export failed",
      },
      { status: 500 }
    );
  }
}

// Helper function to execute database query
async function executeDbQuery(dbUrl: string, query: string) {
  const { Client } = require("pg");
  const client = new Client({
    connectionString: dbUrl,
    statement_timeout: 60000, // 60 seconds for exports
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