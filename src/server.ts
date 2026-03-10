import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const APPS_DIR = path.join(process.cwd(), 'apps');

// Ensure apps directory exists
if (!fs.existsSync(APPS_DIR)) {
  fs.mkdirSync(APPS_DIR, { recursive: true });
}

// Serve static files from 'apps' directory
app.use('/apps', express.static(APPS_DIR));

// Simple health check
app.get('/', (req, res) => {
  res.send('OpenGravity Server is running. Apps are available at /apps/<app-name>');
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Web server running on port ${PORT}`);
    console.log(`📂 Serving apps from: ${APPS_DIR}`);
  });
}
