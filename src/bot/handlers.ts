import { Bot, InputFile } from 'grammy';
import { processUserMessage } from '../agent/index.js';
import { transcribeAudio } from '../agent/llm.js';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';

export function setupHandlers(bot: Bot) {
  bot.command('start', async (ctx) => {
    await ctx.reply('Welcome to OpenGravity! I am your personal AI agent. Send me a message or a voice note to begin.');
  });

  bot.on('message:text', async (ctx) => {
    // Show typing status while thinking
    await ctx.replyWithChatAction('typing');
    
    try {
      const response = await processUserMessage(ctx.from.id, ctx.message.text);
      if (response.startsWith('VOICE_FILE_PATH:')) {
        const filePath = response.replace('VOICE_FILE_PATH:', '');
        await ctx.replyWithVoice(new InputFile(filePath));
        fs.unlinkSync(filePath);
      } else {
        await ctx.reply(response, { parse_mode: 'Markdown' });
      }
    } catch (error: any) {
      console.error("Agent error:", error);
      await ctx.reply('An error occurred while processing your message.');
    }
  });

  bot.on('message:voice', async (ctx) => {
    // Show typing status
    await ctx.replyWithChatAction('typing');

    const voice = ctx.message.voice;
    const fileId = voice.file_id;
    
    try {
      // Get file path from Telegram
      const file = await ctx.getFile();
      const downloadUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      
      // Create temporary file path
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `voice_${fileId}.ogg`);
      
      // Download the file
      const response = await fetch(downloadUrl);
      if (!response.ok || !response.body) throw new Error('Failed to download voice message');
      
      await pipeline(response.body as any, fs.createWriteStream(tempFilePath));
      
      // Transcribe
      const transcribedText = await transcribeAudio(tempFilePath);
      console.log(`📝 Transcribed text: ${transcribedText}`);
      
      // Process with agent
      const agentResponse = await processUserMessage(ctx.from.id, transcribedText);
      
      if (agentResponse.startsWith('VOICE_FILE_PATH:')) {
        const outFilePath = agentResponse.replace('VOICE_FILE_PATH:', '');
        await ctx.replyWithVoice(new InputFile(outFilePath));
        fs.unlinkSync(outFilePath);
      } else {
        await ctx.reply(agentResponse, { parse_mode: 'Markdown' });
      }
      
      // Cleanup
      fs.unlinkSync(tempFilePath);
      
    } catch (error: any) {
      console.error("Voice processing error:", error);
      await ctx.reply('An error occurred while processing your voice message.');
    }
  });
}
