import { z } from 'zod';

/** Shared web environment schema (client-safe vars only). */
export const webEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Creative Factory'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:8000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseWebEnv(env: NodeJS.ProcessEnv = process.env): WebEnv {
  return webEnvSchema.parse({
    NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    NODE_ENV: env.NODE_ENV,
  });
}

/** Server-side web env (not exposed to browser). */
export const webServerEnvSchema = webEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(3000),
});

export type WebServerEnv = z.infer<typeof webServerEnvSchema>;

export function parseWebServerEnv(env: NodeJS.ProcessEnv = process.env): WebServerEnv {
  return webServerEnvSchema.parse({
    NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
  });
}
