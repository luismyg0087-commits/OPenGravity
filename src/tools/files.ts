import fs from 'fs';
import path from 'path';

export const writeFileTool = {
  name: "write_file",
  description: "Creates or overwrites a file with the specified content. Use this to build applications.",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "The path to the file relative to the project root." },
      content: { type: "string", description: "The content to write to the file." }
    },
    required: ["filePath", "content"]
  },
  execute: async ({ filePath, content }: { filePath: string, content: string }) => {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(absolutePath, content);
    return `File written successfully to ${filePath}`;
  }
};

export const readFileTool = {
  name: "read_file",
  description: "Reads the content of a file.",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "The path to the file relative to the project root." }
    },
    required: ["filePath"]
  },
  execute: async ({ filePath }: { filePath: string }) => {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      return `Error: File not found at ${filePath}`;
    }
    return fs.readFileSync(absolutePath, 'utf8');
  }
};
