import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url("Must be a valid Postgres connection URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long for security"),
  PORT: z.string().optional().default("5000"),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().optional(),
});

export const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ CRITICAL: Environment variables validation failed:');
    parsed.error.issues.forEach((e: any) => {
      console.error(`- ${e.path.join('.')}: ${e.message}`);
    });
    process.exit(1);
  }

  return parsed.data;
};

export const env = envSchema.parse(process.env);
