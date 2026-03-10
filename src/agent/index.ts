import { memory } from '../memory/index.js';
import { callLLM } from './llm.js';
import { getToolByName } from '../tools/index.js';

const MAX_ITERATIONS = 5;

// System prompt injects base instructions
const SYSTEM_PROMPT = `You are OpenGravity, a personal AI agent running via Telegram.
Your primary goals are to be helpful, concise, and secure. 
You are an expert software engineer with the power to create, read, and execute code.

RULES FOR TOOLS:
- ONLY use 'speak' if the user explicitly asks for a voice message (e.g., "háblame", "mańdame un audio", "dímelo en voz").
- NEVER use XML-like tags for tools (e.g., <function=...>). Always use the standard tool call format provided by the API.
- For technical tasks, use 'write_file', 'run_command', and 'browse_web'.
- When creating web apps, use the 'apps/<project-name>/' directory. Public URL: ${process.env.RENDER_EXTERNAL_URL || 'https://opengravity.onrender.com'}/apps/<project-name>/index.html`;

export async function processUserMessage(userId: number, text: string): Promise<string> {
  // Add user message to memory
  await memory.addMessage(userId, { role: 'user', content: text });

  let iterations = 0;
  
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    // Fetch conversation history - limit to last 10 messages to avoid token limits
    const history = await memory.getMessages(userId, 10);
    
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history
    ];

    const responseMsg = await callLLM(messages);

    // Handle initial content if present before tool execution
    if (responseMsg.content && !responseMsg.tool_calls) {
      await memory.addMessage(userId, { role: 'assistant', content: responseMsg.content });
      return responseMsg.content;
    }

    // Handle tool calls
    if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
      // If there's content alongside tool calls, save it as a separate assistant message or just ignore it.
      // We will focus on executing the tools.
      for (const toolCall of responseMsg.tool_calls) {
        if (toolCall.type !== 'function') continue;
        // Record assistant's intent to use tool
        await memory.addMessage(userId, {
          role: 'assistant',
          content: toolCall.function.arguments,
          name: toolCall.function.name,
          tool_call_id: toolCall.id
        });

        const tool = getToolByName(toolCall.function.name);
        let toolResultStr = '';
        
        if (tool) {
          try {
            const args = JSON.parse(toolCall.function.arguments || '{}');
            toolResultStr = await tool.execute(args);
          } catch (e: any) {
            toolResultStr = `Error executing tool: ${e.message}`;
          }
        } else {
          toolResultStr = `Error: Tool ${toolCall.function.name} not found.`;
        }
        
        // Record tool output
        await memory.addMessage(userId, {
          role: 'tool',
          content: toolResultStr,
          tool_call_id: toolCall.id
        });

        // SPECIAL CASE: If the tool is 'speak', we might want to break early 
        // or return the file path so the handler can send a voice note.
        if (toolResultStr.startsWith('VOICE_FILE_PATH:')) {
            return toolResultStr;
        }
      }
      // Continue the loop to let the LLM see the tool outputs
    } else {
      // Handle final message from LLM to user
      const finalContent = responseMsg.content || '...';
      await memory.addMessage(userId, { role: 'assistant', content: finalContent });
      return finalContent;
    }
  }

  return "I've reached my thinking limit and need to stop for safety. Please try asking in a different way.";
}
