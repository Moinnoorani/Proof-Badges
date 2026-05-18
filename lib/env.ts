import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BLOB_READ_WRITE_TOKEN: z.string().min(1, "BLOB_READ_WRITE_TOKEN is required"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validated server-side environment variables.
 * Only import this in server-side code (server components, route handlers, server actions).
 * Lazily validated on first access to avoid build-time errors.
 */
let _env: ServerEnv | undefined;

export function getEnv(): ServerEnv {
  if (_env) return _env;

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    console.error("❌ Invalid server environment variables:", formatted);
    throw new Error("Invalid server environment variables");
  }

  _env = result.data;
  return _env;
}

/** Shorthand for getEnv() — use in server-side code only. */
export const env = new Proxy({} as ServerEnv, {
  get(_, prop: string) {
    return getEnv()[prop as keyof ServerEnv];
  },
});
