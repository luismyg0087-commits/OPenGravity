import { textToSpeech } from "../agent/tts.js";

export const speakTool = {
  name: "speak",
  description: "Converts text to speech and prepares a voice note to be sent to the user. Use this when the user asks you to talk, speak, or send a voice message.",
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text to be converted into speech.",
      },
    },
    required: ["text"],
  },
  async execute({ text }: { text: string }) {
    try {
      const audioPath = await textToSpeech(text);
      // We return a special string that the processUserMessage or handlers can catch
      // Since the agent loop saves tool results to memory, we'll prefix it.
      return `VOICE_FILE_PATH:${audioPath}`;
    } catch (error: any) {
      return `Error generating voice: ${error.message}`;
    }
  },
};
