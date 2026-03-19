import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { DbSummary } from '@/lib/db-introspection';
import { projectSchema } from './projectSchema';
import { z } from 'zod';

type CreateProjectRequest = z.infer<typeof projectSchema>;

interface CreateProjectData {
  schema: DbSummary;
  summary: string;
  schemaHash: string;
}

async function createProject(
  userId: string,
  data: CreateProjectRequest,
  dbData: CreateProjectData
) {
  const encryptedDbUrl = encrypt(data.dbUrl);

  try {
    return await prisma.project.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        dbType: data.dbType,
        encryptedDbUrl,
        dbSchema: JSON.parse(JSON.stringify(dbData.schema)),
        dbSummary: dbData.summary,
        schemaHash: dbData.schemaHash,
        lastSyncAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        dbType: true,
        dbSummary: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error('Failed to create project in database:', error);
    throw new Error('Failed to save project. Please try again.');
  }
}

export default createProject;
