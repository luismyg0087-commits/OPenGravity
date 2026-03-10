import { startBot } from './bot/index.js';
import { startServer } from './server.js';

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Start the web server
startServer();

// Start the telegram bot
startBot().catch(console.error);
