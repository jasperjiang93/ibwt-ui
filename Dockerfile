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

# Generate Prisma client
RUN pnpm db:generate

# Build-time env vars (NEXT_PUBLIC_* are inlined by Next.js at build time)
ARG NEXT_PUBLIC_GATEWAY_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_NETWORK
ARG NEXT_PUBLIC_SOLANA_RPC_URL_TESTNET
ARG NEXT_PUBLIC_SOLANA_RPC_URL_MAINNET
ARG NEXT_PUBLIC_IBWT_TOKEN_MINT_TESTNET
ARG NEXT_PUBLIC_IBWT_TOKEN_MINT_MAINNET
ARG NEXT_PUBLIC_TREASURY_WALLET_TESTNET
ARG NEXT_PUBLIC_TREASURY_WALLET_MAINNET
ARG NEXT_PUBLIC_GA_ID

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
