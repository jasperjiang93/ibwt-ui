FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY . .

# Generate Prisma client & build
RUN pnpm db:generate
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
