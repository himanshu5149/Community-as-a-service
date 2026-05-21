# ─── BUILD STAGE ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for compiling)
RUN npm ci

# Copy remaining source code
COPY . .

# Build application (generates frontend assets and compiles server.ts to dist/server.cjs)
RUN npm run build

# ─── RUNNER STAGE ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only to keep the image slim
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create a clean security layer and change ownership to a non-privileged system user
RUN chown -R node:node /usr/src/app
USER node

# Port 3000 is externally exposed by our system mapping
EXPOSE 3000

# Run the production bundle
CMD ["node", "dist/server.cjs"]
