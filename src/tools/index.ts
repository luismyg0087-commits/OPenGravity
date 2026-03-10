import { getCurrentTimeTool } from './get_current_time.js';
import { speakTool } from './speak.js';
import { writeFileTool, readFileTool } from './files.js';
import { runCommandTool } from './terminal.js';
import { browseWebTool } from './browser.js';

export interface Tool<T = any> {
  name: string;
  description: string;
  parameters: any; // JSON schema object for the LLM
  execute: (args: T) => Promise<string> | string;
}

export const tools: Tool[] = [
  getCurrentTimeTool,
  speakTool,
  writeFileTool,
  readFileTool,
  runCommandTool,
  browseWebTool
];

export const getToolByName = (name: string) => tools.find(t => t.name === name);
