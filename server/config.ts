import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  PASSWORD_PEPPER: z.string().min(1, "PASSWORD_PEPPER is required"),
  SENDGRID_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  GROQ_API_KEY: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join(", ");
  throw new Error(`Invalid environment configuration: ${message}`);
}

const env = parsed.data;

export const config = {
  ...env,
  port: parseInt(env.PORT || "5000", 10),
};

export type AppConfig = typeof config;


