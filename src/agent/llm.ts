import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { config } from '../config.js';
import { tools } from '../tools/index.js';
import { MessageRow } from '../memory/index.js';

const groq = new Groq({ apiKey: config.GROQ_API_KEY });
const openrouter = config.OPENROUTER_API_KEY
  ? new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: config.OPENROUTER_API_KEY,
    })
  : null;

// Format tools for Groq/OpenAI
const formattedTools = tools.map(t => ({
  type: 'function' as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }
}));

export async function callLLM(messages: MessageRow[], useFallback = false) {
  // Convert our simplified DB messages to LLM expected format
  const formattedMessages = messages.map(msg => {
    if (msg.role === 'tool') {
      return { 
        role: 'tool', 
        content: msg.content, 
        tool_call_id: msg.tool_call_id 
      };
    }
    if (msg.role === 'assistant' && msg.tool_call_id && msg.name) {
      // It's a tool call initiated by the assistant
      return { 
        role: 'assistant', 
        content: msg.content || null, 
        tool_calls: [
          {
            id: msg.tool_call_id,
            type: 'function',
            function: { 
              name: msg.name, 
              arguments: msg.content || '{}' 
            }
          }
        ] 
      };
    }
    return { role: msg.role, content: msg.content };
  });

  try {
    if (useFallback && openrouter) {
       const response = await openrouter.chat.completions.create({
         model: config.OPENROUTER_MODEL,
         messages: formattedMessages as any,
         tools: formattedTools.length > 0 ? formattedTools : undefined,
         tool_choice: 'auto'
       });
       return response.choices[0].message;
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: formattedMessages as any,
      tools: formattedTools.length > 0 ? formattedTools : undefined,
      tool_choice: 'auto'
    });
    
    return response.choices[0].message;
  } catch (error: any) {
    // If Groq rate limits us or fails, try OpenRouter as fallback
    if (!useFallback && openrouter && (error?.status === 429 || error?.status >= 500)) {
      console.warn('Groq failed or rate limited. Falling back to OpenRouter.');
      return callLLM(messages, true);
    }
    throw error;
  }
}
