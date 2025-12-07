FROM mcr.microsoft.com/playwright:v1.57.0

WORKDIR /app

# Install bun
RUN npm install -g bun@1.3.4

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies (skip postinstall since browsers are pre-installed)
RUN bun install --ignore-scripts

# Copy application code
COPY . .

# Build the Next.js app
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
