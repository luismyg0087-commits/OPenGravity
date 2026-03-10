import { Bot } from 'grammy';
import { processUserMessage } from '../agent/index.js';

export function setupHandlers(bot: Bot) {
  bot.command('start', async (ctx) => {
    await ctx.reply('Welcome to OpenGravity! I am your personal AI agent. Send me a message to begin.');
  });

  bot.on('message:text', async (ctx) => {
    // Show typing status while thinking
    await ctx.replyWithChatAction('typing');
    
    try {
      const response = await processUserMessage(ctx.from.id, ctx.message.text);
      await ctx.reply(response, { parse_mode: 'Markdown' });
    } catch (error: any) {
      console.error("Agent error:", error);
      await ctx.reply('An error occurred while processing your message.');
    }
  });
}
