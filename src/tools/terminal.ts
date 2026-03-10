import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const runCommandTool = {
  name: "run_command",
  description: "Executes a shell command in the project directory. Use this to install dependencies or run the applications you build.",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "The command to execute." }
    },
    required: ["command"]
  },
  execute: async ({ command }: { command: string }) => {
    try {
      const { stdout, stderr } = await execAsync(command);
      return `Output:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`;
    } catch (error: any) {
      return `Command failed: ${error.message}${error.stderr ? `\nStderr:\n${error.stderr}` : ''}`;
    }
  }
};
