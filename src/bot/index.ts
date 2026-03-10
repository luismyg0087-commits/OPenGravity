import { Bot } from 'grammy';
import { config } from '../config.js';
import { authMiddleware } from './middleware.js';
import { setupHandlers } from './handlers.js';

// Init bot
export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// Apply auth middleware
bot.use(authMiddleware);

// Setup handlers
setupHandlers(bot);

export async function startBot() {
  console.log("Starting OpenGravity Bot...");
  
  // Catch bot errors
  bot.catch((err) => {
    console.error(`Error for ${err.ctx.update.update_id}:`, err.error);
  });

  await bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot started successfully as @${botInfo.username}`);
    }
  }); // Starts telegram bots using long polling
}
