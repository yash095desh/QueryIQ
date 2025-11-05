import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  dbUrl: z.string().trim().min(1, 'Database URL is required'),
  dbType: z.string().trim().toLowerCase(),
  description: z.string().trim().optional(),
});

