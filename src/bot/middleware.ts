import { Context, NextFunction } from 'grammy';
import { config } from '../config.js';

export async function authMiddleware(ctx: Context, next: NextFunction) {
  const userId = ctx.from?.id;
  
  if (!userId || !config.ALLOWED_USER_IDS.includes(userId)) {
    console.log(`Unauthorized access attempt from User ID: ${userId || 'unknown'}`);
    return;
  }
  
  await next();
}
