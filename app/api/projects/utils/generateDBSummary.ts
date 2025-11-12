import {
  introspectDatabase,
  DatabaseConnectionError,
  DatabaseIntrospectionError,
  UnsupportedDatabaseError,
} from '@/lib/db-introspection';

// ===========================
// Helper: Generate DB Summary
// ===========================
async function generateDbSummary(dbUrl: string, dbType: string) {
  try {
    console.log(`🔍 Starting database introspection for ${dbType}...`);
    const summary = await introspectDatabase(dbUrl, dbType);
    console.log(` Database introspection completed successfully`);

    return {
      summary,
      introspectedAt: new Date().toISOString(),
      dbType,
    };
  } catch (error) {
    if (error instanceof DatabaseConnectionError)
      throw new Error('Failed to connect to database. Check your connection string and credentials.');
    if (error instanceof DatabaseIntrospectionError)
      throw new Error('Failed to read database schema. Ensure proper permissions.');
    if (error instanceof UnsupportedDatabaseError)
      throw new Error(error.message);

    console.error(' Unexpected error during introspection:', error);
    throw new Error('Unexpected error while analyzing the database.');
  }
}

export default generateDbSummary;