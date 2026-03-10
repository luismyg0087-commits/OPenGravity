import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Schema for environment validation
const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Bot token is required"),
  TELEGRAM_ALLOWED_USER_IDS: z.string().min(1, "Allowed user IDs are required"),
  GROQ_API_KEY: z.string().min(1, "Groq API key is required"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openrouter/free"),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().default("./service-account.json"),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
});

// Parse and validate
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const config = {
  ...parsedEnv.data,
  // Convert comma-separated string to array of numbers for easy auth checking
  ALLOWED_USER_IDS: parsedEnv.data.TELEGRAM_ALLOWED_USER_IDS
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id)),
};
