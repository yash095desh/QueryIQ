import {
  introspectDatabase,
  generateSchemaHash,
  DatabaseConnectionError,
  DatabaseIntrospectionError,
  UnsupportedDatabaseError,
  DbSummary,
} from '@/lib/db-introspection';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.API_KEY_REF!,
});

/**
 * Generate a concise, LLM-friendly summary from a full schema.
 * This compressed summary goes into the system prompt to save tokens.
 */
async function generateAISummary(schema: DbSummary, dbType: string): Promise<string> {
  const schemaJson = JSON.stringify(schema);

  const { text } = await generateText({
    model: openrouter('openai/gpt-4o-mini'),
    prompt: `You are a database schema summarizer. Given the following ${dbType.toUpperCase()} database schema, generate a concise natural language summary that an AI assistant can use to write queries.

Rules:
- List all tables/collections with their column names and types in a compact format
- Highlight primary keys, foreign key relationships if obvious from naming (e.g., user_id → users)
- Keep it under 300 words
- Use a flat, dense format — no markdown headers or bullet points
- Focus on what a query-writing AI needs to know

Schema:
${schemaJson}`,
  });

  return text.trim();
}

/**
 * Introspect a database and return both the full schema and a compressed AI summary.
 */
async function generateDbSummary(dbUrl: string, dbType: string) {
  try {
    const schema = await introspectDatabase(dbUrl, dbType);
    const schemaHash = generateSchemaHash(schema);

    // Generate AI-compressed summary for system prompt
    let aiSummary: string;
    try {
      aiSummary = await generateAISummary(schema, dbType);
    } catch (error) {
      // Fallback: use a basic stringified version if AI summary fails
      console.error('AI summary generation failed, using fallback:', error);
      aiSummary = Array.isArray(schema)
        ? schema.map((item: any) => {
            if ('table' in item) {
              return `${item.table}: ${item.columns.map((c: any) => `${c.name}(${c.type})`).join(', ')}`;
            }
            return `${item.collection}: ${item.documentCount} docs`;
          }).join('. ')
        : JSON.stringify(schema);
    }

    return {
      schema,       // Full structured schema → stored in dbSchema (Json)
      summary: aiSummary, // Compressed text → stored in dbSummary (String)
      schemaHash,   // Hash for drift detection → stored in schemaHash
    };
  } catch (error) {
    if (error instanceof DatabaseConnectionError)
      throw new Error('Failed to connect to database. Check your connection string and credentials.');
    if (error instanceof DatabaseIntrospectionError)
      throw new Error('Failed to read database schema. Ensure proper permissions.');
    if (error instanceof UnsupportedDatabaseError)
      throw new Error(error.message);

    console.error('Unexpected error during introspection:', error);
    throw new Error('Unexpected error while analyzing the database.');
  }
}

export default generateDbSummary;
