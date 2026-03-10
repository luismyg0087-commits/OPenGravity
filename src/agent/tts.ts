import { ElevenLabsClient } from "elevenlabs";
import { config } from "../config.js";
import fs from "fs";
import path from "path";
import os from "os";

const client = new ElevenLabsClient({
  apiKey: config.ELEVENLABS_API_KEY,
});

/**
 * Converts text to speech and returns the path to the temporary audio file
 */
export async function textToSpeech(text: string): Promise<string> {
  console.log(`🔊 Converting text to speech: ${text.slice(0, 50)}...`);
  
  if (!config.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  try {
    const audio = await client.generate({
      voice: "Jessica", // A premium-sounding voice
      text: text,
      model_id: "eleven_multilingual_v2",
    });

    const tempDir = os.tmpdir();
    const fileName = `tts_${Date.now()}.mp3`;
    const filePath = path.join(tempDir, fileName);
    
    const fileStream = fs.createWriteStream(filePath);
    
    // The 'audio' is a Readable Stream
    await new Promise((resolve, reject) => {
      audio.pipe(fileStream);
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });

    return filePath;
  } catch (error) {
    console.error("TTS error:", error);
    throw new Error("Failed to generate speech.");
  }
}
