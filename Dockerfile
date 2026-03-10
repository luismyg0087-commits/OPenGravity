# Use official Node.js image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Environment variables will be handled by Render UI
# Start the bot
CMD ["npm", "run", "dev"]
