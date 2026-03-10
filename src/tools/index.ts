import { getCurrentTimeTool } from './get_current_time.js';
import { speakTool } from './speak.js';

export interface Tool<T = any> {
  name: string;
  description: string;
  parameters: any; // JSON schema object for the LLM
  execute: (args: T) => Promise<string> | string;
}

export const tools: Tool[] = [
  getCurrentTimeTool,
  speakTool
];

export const getToolByName = (name: string) => tools.find(t => t.name === name);
