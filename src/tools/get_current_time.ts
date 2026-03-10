import { Tool } from './index.js';

export const getCurrentTimeTool: Tool<{}> = {
  name: 'get_current_time',
  description: 'Get the current local time of the system.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: () => {
    return `The current local time is: ${new Date().toLocaleString()}`;
  }
};
