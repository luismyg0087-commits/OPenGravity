import { memory } from '../memory/index.js';
import { callLLM } from './llm.js';
import { getToolByName } from '../tools/index.js';

const MAX_ITERATIONS = 5;

// System prompt injects base instructions
const SYSTEM_PROMPT = `You are OpenGravity, a personal AI agent running locally via Telegram.
Your primary goals are to be helpful, concise, and secure. 
You are an expert software engineer. You have the power to create, read, and execute code on your local system.
When a user asks you to create an application or a script:
1. Plan the structure.
2. Use 'write_file' to create the necessary files.
3. Use 'run_command' to install dependencies (if needed) and run the code to verify it.
4. Confirm completion to the user.
You can also use 'speak' to reply with voice notes if the user asks you to speak or if it feels appropriate.`;

export async function processUserMessage(userId: number, text: string): Promise<string> {
  // Add user message to memory
  await memory.addMessage(userId, { role: 'user', content: text });

  let iterations = 0;
  
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    // Fetch conversation history
    const history = await memory.getMessages(userId);
    
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
